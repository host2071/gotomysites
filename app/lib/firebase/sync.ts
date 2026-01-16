"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { KeywordMapping } from "../../types";
import { User } from "firebase/auth";
import { getOrCreateSite, removeSiteUsage, getSiteByKeyword } from "./sites";

const USERS_COLLECTION = "users";

/**
 * Удаляет поля со значением undefined из объекта
 * Firebase не поддерживает undefined значения
 */
const removeUndefinedFields = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

export interface UserSite {
  siteId: string;
  keyword: string;
  url: string;
  description?: string;
  searchPath?: string;
  searchParam?: string;
  addedAt: Timestamp;
}

export interface UserData {
  userId: string;
  email: string;
  sites: UserSite[];
  settings?: {
    defaultSearchEngine?: string;
  };
  order: string[];
  syncedAt: Timestamp;
}

/**
 * Синхронизировать данные пользователя в облако
 */
export const syncToCloud = async (
  user: User,
  keywords: KeywordMapping[],
  order: string[] = [],
  settings?: any
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);

  // Убираем дубликаты по ключевому слову (case-insensitive)
  const uniqueKeywords = keywords.filter((keyword, index, self) =>
    index === self.findIndex((k) => k.keyword.toLowerCase() === keyword.keyword.toLowerCase())
  );

  // Преобразуем keywords в UserSite с siteId
  const userSites: UserSite[] = await Promise.all(
    uniqueKeywords.map(async (keyword) => {
      // Получаем или создаем сайт в коллекции sites
      const siteId = await getOrCreateSite(keyword);
      
      // Проверяем, есть ли сайт в базе, чтобы использовать данные оттуда
      const existingSite = await getSiteByKeyword(keyword.keyword.toLowerCase());
      
      // Если сайт существует в базе, используем данные из базы, иначе используем переданные данные
      const siteData = existingSite || keyword;

      const userSite = {
        siteId,
        keyword: siteData.keyword,
        url: siteData.url,
        description: siteData.description,
        searchPath: siteData.searchPath,
        searchParam: siteData.searchParam,
        addedAt: Timestamp.now(),
      };

      // Удаляем undefined поля перед возвратом
      return removeUndefinedFields(userSite) as UserSite;
    })
  );

  // Всегда создаем/обновляем документ пользователя
  // merge: true гарантирует, что документ будет создан, если его нет
  await setDoc(
    userRef,
    {
      userId: user.uid,
      email: user.email || "",
      sites: userSites,
      order,
      settings: settings || {},
      syncedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Загрузить данные пользователя из облака
 */
export const syncFromCloud = async (
  user: User
): Promise<{ keywords: KeywordMapping[]; order: string[]; settings?: any } | null> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as UserData;
    
    // Преобразуем UserSite обратно в KeywordMapping
    const keywords: KeywordMapping[] = data.sites.map((userSite) => ({
      keyword: userSite.keyword,
      url: userSite.url,
      description: userSite.description,
      searchPath: userSite.searchPath,
      searchParam: userSite.searchParam,
    }));

    return {
      keywords,
      order: data.order || [],
      settings: data.settings,
    };
  }

  return null;
};

/**
 * Добавить сайт пользователю
 */
export const addSiteToUser = async (
  user: User,
  keyword: KeywordMapping
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);
  
  // Получаем или создаем сайт в коллекции sites
  const siteId = await getOrCreateSite(keyword);
  
  // Проверяем, есть ли сайт в базе
  const existingSiteInDb = await getSiteByKeyword(keyword.keyword.toLowerCase());

  // Проверяем, существует ли уже сайт у пользователя с таким ключевым словом
  if (userDoc.exists()) {
    const data = userDoc.data() as UserData;
    const existingUserSite = data.sites.find(
      (s) => s.keyword.toLowerCase() === keyword.keyword.toLowerCase()
    );
    
    // Если сайт уже существует у пользователя, обновляем его данные (если новые поля заполнены)
    if (existingUserSite) {
      const updatedUserSite: Partial<UserSite> = {
        siteId: existingUserSite.siteId,
        keyword: existingUserSite.keyword,
        url: existingUserSite.url,
        description: existingUserSite.description,
        searchPath: existingUserSite.searchPath,
        searchParam: existingUserSite.searchParam,
      };
      
      // Обновляем только заполненные поля из переданных данных
      if (keyword.url) {
        updatedUserSite.url = keyword.url;
      }
      if (keyword.description !== undefined) {
        updatedUserSite.description = keyword.description;
      }
      if (keyword.searchPath !== undefined) {
        updatedUserSite.searchPath = keyword.searchPath;
      }
      if (keyword.searchParam !== undefined) {
        updatedUserSite.searchParam = keyword.searchParam;
      }
      
      // Удаляем старый сайт и добавляем обновленный
      await updateDoc(userRef, {
        sites: arrayRemove(existingUserSite),
        syncedAt: serverTimestamp(),
      });
      
      const newUserSite = removeUndefinedFields({
        ...updatedUserSite,
        addedAt: existingUserSite.addedAt, // Сохраняем оригинальную дату добавления
      }) as UserSite;
      
      await updateDoc(userRef, {
        sites: arrayUnion(newUserSite),
        syncedAt: serverTimestamp(),
      });
      
      return;
    }
  }

  // Если сайт существует в базе, используем данные из базы, иначе используем переданные данные
  const siteData = existingSiteInDb || keyword;

  const userSiteRaw = {
    siteId,
    keyword: siteData.keyword,
    url: siteData.url,
    description: siteData.description,
    searchPath: siteData.searchPath,
    searchParam: siteData.searchParam,
    addedAt: Timestamp.now(),
  };

  // Удаляем undefined поля перед сохранением в Firebase
  const userSite = removeUndefinedFields(userSiteRaw) as UserSite;

  // Если документ не существует, создаем его
  if (!userDoc.exists()) {
    await setDoc(userRef, {
      userId: user.uid,
      email: user.email || "",
      sites: [userSite],
      order: [],
      settings: {},
      syncedAt: serverTimestamp(),
    });
  } else {
    // Если документ существует, обновляем его
    await updateDoc(userRef, {
      sites: arrayUnion(userSite),
      syncedAt: serverTimestamp(),
    });
  }
};

/**
 * Удалить сайт у пользователя
 */
export const removeSiteFromUser = async (
  user: User,
  keyword: string
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data() as UserData;
    const siteToRemove = data.sites.find(
      (s) => s.keyword.toLowerCase() === keyword.toLowerCase()
    );

    if (siteToRemove) {
      // Удаляем из массива пользователя
      await updateDoc(userRef, {
        sites: arrayRemove(siteToRemove),
        syncedAt: serverTimestamp(),
      });

      // Уменьшаем счетчик использования сайта
      await removeSiteUsage(siteToRemove.siteId);
    }
  }
};

/**
 * Обновить порядок сайтов пользователя
 */
export const updateUserOrder = async (
  user: User,
  order: string[]
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);

  // Если документ не существует, создаем его
  if (!userDoc.exists()) {
    await setDoc(userRef, {
      userId: user.uid,
      email: user.email || "",
      sites: [],
      order,
      settings: {},
      syncedAt: serverTimestamp(),
    });
  } else {
    // Если документ существует, обновляем его
    await updateDoc(userRef, {
      order,
      syncedAt: serverTimestamp(),
    });
  }
};

/**
 * Подписаться на изменения данных пользователя
 */
export const subscribeToUserChanges = (
  user: User,
  callback: (data: { keywords: KeywordMapping[]; order: string[]; settings?: any } | null) => void
): (() => void) => {
  if (!db) {
    return () => {};
  }

  const userRef = doc(db, USERS_COLLECTION, user.uid);

  return onSnapshot(userRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as UserData;
      
      const keywords: KeywordMapping[] = data.sites.map((userSite) => ({
        keyword: userSite.keyword,
        url: userSite.url,
        description: userSite.description,
        searchPath: userSite.searchPath,
        searchParam: userSite.searchParam,
      }));

      callback({
        keywords,
        order: data.order || [],
        settings: data.settings,
      });
    } else {
      callback(null);
    }
  });
};

