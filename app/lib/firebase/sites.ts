"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  increment,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { KeywordMapping } from "../../types";

export interface Site extends KeywordMapping {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
  update?: boolean; // Флаг, разрешающий обновление сайта пользователем
}

const SITES_COLLECTION = "sites";

/**
 * Создать или получить существующий сайт
 */
export const getOrCreateSite = async (
  siteData: KeywordMapping
): Promise<string> => {
  if (!db) throw new Error("Firebase not initialized");

  // Проверяем, существует ли сайт с таким keyword
  const sitesRef = collection(db, SITES_COLLECTION);
  const q = query(sitesRef, where("keyword", "==", siteData.keyword.toLowerCase()));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Сайт существует
    const existingSiteDoc = querySnapshot.docs[0];
    const existingSite = existingSiteDoc.data() as Site;
    const siteId = existingSiteDoc.id;
    
    // Обновляем счетчик использования
    await updateDoc(doc(db, SITES_COLLECTION, siteId), {
      usageCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // Если флаг update не false, обновляем данные сайта (если новые поля заполнены)
    if (existingSite.update !== false) {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };
      
      // Обновляем только заполненные поля
      if (siteData.url && siteData.url !== existingSite.url) {
        updateData.url = siteData.url;
      }
      if (siteData.description !== undefined && siteData.description !== existingSite.description) {
        updateData.description = siteData.description || null;
      }
      if (siteData.searchPath !== undefined && siteData.searchPath !== existingSite.searchPath) {
        updateData.searchPath = siteData.searchPath || null;
      }
      if (siteData.searchParam !== undefined && siteData.searchParam !== existingSite.searchParam) {
        updateData.searchParam = siteData.searchParam || null;
      }
      
      // Обновляем только если есть изменения
      if (Object.keys(updateData).length > 1) {
        await updateDoc(doc(db, SITES_COLLECTION, siteId), updateData);
      }
    }
    
    return siteId;
  }

  // Создаем новый сайт
  const newSiteRef = doc(collection(db, SITES_COLLECTION));
  await setDoc(newSiteRef, {
    keyword: siteData.keyword.toLowerCase(),
    url: siteData.url,
    description: siteData.description || null,
    searchPath: siteData.searchPath || null,
    searchParam: siteData.searchParam || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    usageCount: 1,
    update: true, // По умолчанию разрешаем обновление
  });

  return newSiteRef.id;
};

/**
 * Получить сайт по ID
 */
export const getSiteById = async (siteId: string): Promise<Site | null> => {
  if (!db) throw new Error("Firebase not initialized");

  const siteRef = doc(db, SITES_COLLECTION, siteId);
  const siteSnap = await getDoc(siteRef);

  if (siteSnap.exists()) {
    return {
      id: siteSnap.id,
      ...siteSnap.data(),
    } as Site;
  }

  return null;
};

/**
 * Получить сайт по keyword
 */
export const getSiteByKeyword = async (keyword: string): Promise<Site | null> => {
  if (!db) throw new Error("Firebase not initialized");

  const sitesRef = collection(db, SITES_COLLECTION);
  const q = query(sitesRef, where("keyword", "==", keyword.toLowerCase()));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const siteDoc = querySnapshot.docs[0];
    return {
      id: siteDoc.id,
      ...siteDoc.data(),
    } as Site;
  }

  return null;
};

/**
 * Получить все популярные сайты (для публичного каталога)
 */
export const getPopularSites = async (limitCount: number = 10): Promise<Site[]> => {
  if (!db) throw new Error("Firebase not initialized");

  const sitesRef = collection(db, SITES_COLLECTION);
  const q = query(sitesRef, orderBy("usageCount", "desc"), limit(limitCount));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Site[];
};

/**
 * Удалить сайт (уменьшить счетчик использования)
 */
export const removeSiteUsage = async (siteId: string): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const siteRef = doc(db, SITES_COLLECTION, siteId);
  await updateDoc(siteRef, {
    usageCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Обновить сайт (только если флаг update разрешает)
 */
export const updateSite = async (
  siteId: string,
  siteData: Partial<KeywordMapping>
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const siteRef = doc(db, SITES_COLLECTION, siteId);
  const siteSnap = await getDoc(siteRef);

  if (!siteSnap.exists()) {
    throw new Error("Site not found");
  }

  const site = siteSnap.data() as Site;

  // Проверяем флаг update
  if (site.update === false) {
    throw new Error("Site is not allowed");
  }

  // Обновляем только переданные поля
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  if (siteData.keyword !== undefined) {
    updateData.keyword = siteData.keyword.toLowerCase();
  }
  if (siteData.url !== undefined) {
    updateData.url = siteData.url;
  }
  if (siteData.description !== undefined) {
    updateData.description = siteData.description || null;
  }
  if (siteData.searchPath !== undefined) {
    updateData.searchPath = siteData.searchPath || null;
  }
  if (siteData.searchParam !== undefined) {
    updateData.searchParam = siteData.searchParam || null;
  }

  await updateDoc(siteRef, updateData);
};

/**
 * Установить флаг update для сайта
 */
export const setSiteUpdateFlag = async (
  siteId: string,
  allowUpdate: boolean
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const siteRef = doc(db, SITES_COLLECTION, siteId);
  await updateDoc(siteRef, {
    update: allowUpdate,
    updatedAt: serverTimestamp(),
  });
};

