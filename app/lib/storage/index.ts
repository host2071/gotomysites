"use client";

import { getCurrentUser, onAuthChange } from "../firebase/auth";
import {
  syncFromCloud,
  addSiteToUser,
  removeSiteFromUser,
  updateUserOrder,
  subscribeToUserChanges,
} from "../firebase/sync";
import {
  loadData as loadLocalData,
  saveData as saveLocalData,
  getKeywords as getLocalKeywords,
  addKeyword as addLocalKeyword,
  removeKeyword as removeLocalKeyword,
  findKeyword as findLocalKeyword,
  getOrder as getLocalOrder,
  saveOrder as saveLocalOrder,
} from "./local";
import type { StorageData, KeywordMapping } from "../../types";

/**
 * Загрузить данные пользователя
 * Для авторизованных - сначала из localStorage (быстро), затем синхронизация с Firebase в фоне
 * Для неавторизованных - из localStorage
 */
export const loadData = async (): Promise<StorageData> => {
  const user = await getCurrentUser();
  
  if (!user) {
    // Неавторизованный пользователь - используем localStorage
    return loadLocalData();
  }

  // Авторизованный пользователь - сначала возвращаем данные из localStorage (быстро)
  const localData = loadLocalData();
  
  // Затем синхронизируем с Firebase в фоне (не блокируем загрузку)
  syncFromCloud(user).then((cloudData) => {
    if (cloudData) {
      const storageData: StorageData = {
        keywords: cloudData.keywords,
        settings: cloudData.settings || {
          defaultSearchEngine: "https://google.com/search?q=",
        },
      };
      // Обновляем localStorage данными из Firebase
      saveLocalData(storageData);
      if (cloudData.order) {
        saveLocalOrder(cloudData.order);
      }
    }
  }).catch((error) => {
    console.error("Error syncing from cloud:", error);
  });

  // Возвращаем данные из localStorage немедленно
  return localData;
};

/**
 * Сохранить данные
 * Для авторизованных - в Firebase и localStorage, для неавторизованных - в localStorage
 */
export const saveData = async (data: StorageData): Promise<void> => {
  const user = await getCurrentUser();
  
  // Всегда сохраняем в localStorage для быстрого доступа
  saveLocalData(data);
  // Отправляем событие для обновления в текущей вкладке
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Неавторизованный пользователь - только localStorage
    return;
  }

  // Авторизованный пользователь - также сохраняем в Firebase
  const { syncToCloud } = await import("../firebase/sync");
  try {
    await syncToCloud(user, data.keywords, [], data.settings);
  } catch (error) {
    console.error("Error syncing to cloud:", error);
  }
};

/**
 * Получить список ключевых слов
 * Для авторизованных - сначала из localStorage (быстро), затем синхронизация с Firebase в фоне
 * Для неавторизованных - из localStorage
 */
export const getKeywords = async (): Promise<KeywordMapping[]> => {
  const user = await getCurrentUser();
  
  // Всегда возвращаем из localStorage для быстрого доступа
  const localKeywords = getLocalKeywords();
  
  if (user) {
    // Авторизованный пользователь - синхронизируем с Firebase в фоне
    syncFromCloud(user).then((cloudData) => {
      if (cloudData && cloudData.keywords.length > 0) {
        // Обновляем localStorage данными из Firebase
        const storageData: StorageData = {
          keywords: cloudData.keywords,
          settings: cloudData.settings || {
            defaultSearchEngine: "https://google.com/search?q=",
          },
        };
        saveLocalData(storageData);
        if (cloudData.order) {
          saveLocalOrder(cloudData.order);
        }
      }
    }).catch((error) => {
      console.error("Error syncing from cloud:", error);
    });
  }

  return localKeywords;
};

/**
 * Синхронная версия для быстрого доступа
 * Всегда возвращает данные из localStorage
 */
export const getKeywordsSync = (): KeywordMapping[] => {
  return getLocalKeywords();
};

/**
 * Добавить ключевое слово
 * Для авторизованных - в Firebase и localStorage, для неавторизованных - в localStorage
 */
export const addKeyword = async (keyword: KeywordMapping): Promise<void> => {
  const user = await getCurrentUser();
  
  // Всегда сохраняем в localStorage для быстрого доступа
  addLocalKeyword(keyword);
  // Отправляем событие для обновления в текущей вкладке
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Неавторизованный пользователь - только localStorage
    return;
  }

  // Авторизованный пользователь - также сохраняем в Firebase
  try {
    await addSiteToUser(user, keyword);
  } catch (error) {
    console.error("Error adding keyword to cloud:", error);
  }
};

/**
 * Удалить ключевое слово
 * Для авторизованных - из Firebase и localStorage, для неавторизованных - из localStorage
 */
export const removeKeyword = async (keyword: string): Promise<void> => {
  const user = await getCurrentUser();
  
  // Всегда удаляем из localStorage для быстрого доступа
  removeLocalKeyword(keyword);
  // Отправляем событие для обновления в текущей вкладке
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Неавторизованный пользователь - только localStorage
    return;
  }

  // Авторизованный пользователь - также удаляем из Firebase
  try {
    await removeSiteFromUser(user, keyword);
  } catch (error) {
    console.error("Error removing keyword from cloud:", error);
  }
};

/**
 * Найти ключевое слово
 * Всегда ищет в localStorage для быстрого доступа
 */
export const findKeyword = async (keyword: string): Promise<KeywordMapping | null> => {
  // Используем синхронную версию для быстрого поиска
  return findLocalKeyword(keyword);
};

/**
 * Синхронная версия для неавторизованных пользователей
 */
export const findKeywordSync = (keyword: string): KeywordMapping | null => {
  return findLocalKeyword(keyword);
};

/**
 * Получить порядок сайтов
 * Всегда из localStorage для быстрого доступа
 */
export const getOrder = async (): Promise<string[]> => {
  return getLocalOrder() || [];
};

/**
 * Сохранить порядок сайтов
 * Для авторизованных - в Firebase и localStorage, для неавторизованных - в localStorage
 */
export const saveOrder = async (order: string[]): Promise<void> => {
  const user = await getCurrentUser();
  
  // Всегда сохраняем в localStorage для быстрого доступа
  saveLocalOrder(order);
  // Отправляем событие для обновления в текущей вкладке
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Неавторизованный пользователь - только localStorage
    return;
  }

  // Авторизованный пользователь - также сохраняем в Firebase
  try {
    await updateUserOrder(user, order);
  } catch (error) {
    console.error("Error updating order in cloud:", error);
  }
};

/**
 * Подписаться на изменения данных пользователя
 */
export const subscribeToDataChanges = (
  callback: (data: { keywords: KeywordMapping[]; order: string[]; settings?: any } | null) => void
): (() => void) => {
  let unsubscribe: (() => void) | null = null;
  let storageListener: ((e: Event) => void) | null = null;
  let customEventListener: ((e: Event) => void) | null = null;
  let isUnsubscribed = false;
  let authUnsubscribe: (() => void) | null = null;

  const updateLocalData = () => {
    const localData = loadLocalData();
    callback({
      keywords: localData.keywords,
      order: getLocalOrder() || [],
      settings: localData.settings,
    });
  };

  const setupSubscription = async () => {
    if (isUnsubscribed) return;

    // Отписываемся от предыдущей подписки, если она есть
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    // Удаляем предыдущие слушатели localStorage
    if (typeof window !== "undefined") {
      if (storageListener) {
        window.removeEventListener("storage", storageListener);
      }
      if (customEventListener) {
        window.removeEventListener("localStorage-update", customEventListener);
      }
      storageListener = null;
      customEventListener = null;
    }

    const user = await getCurrentUser();
    
    if (isUnsubscribed) return;

    if (user) {
      // Авторизованный пользователь - подписываемся на изменения в Firebase
      unsubscribe = subscribeToUserChanges(user, (cloudData) => {
        if (isUnsubscribed) return;

        if (cloudData) {
          // Обновляем localStorage при изменении данных в Firebase
          const storageData: StorageData = {
            keywords: cloudData.keywords,
            settings: cloudData.settings || {
              defaultSearchEngine: "https://google.com/search?q=",
            },
          };
          saveLocalData(storageData);
          if (cloudData.order) {
            saveLocalOrder(cloudData.order);
          }
          // Отправляем событие для обновления UI
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("localStorage-update"));
          }
        }
        // Вызываем callback для обновления UI
        callback(cloudData);
      });
    } else {
      // Неавторизованный пользователь - возвращаем данные из localStorage
      updateLocalData();
      
      // Подписываемся на изменения localStorage (для обновления в других вкладках и текущей)
      if (typeof window !== "undefined") {
        storageListener = (e: Event) => {
          if (isUnsubscribed) return;
          const storageEvent = e as StorageEvent;
          // Событие из других вкладок
          if (storageEvent.key === "goWebsiteLauncherData" || storageEvent.key === "goWebsiteLauncherOrder") {
            updateLocalData();
          }
        };
        
        customEventListener = () => {
          if (isUnsubscribed) return;
          // Кастомное событие из текущей вкладки
          updateLocalData();
        };
        
        window.addEventListener("storage", storageListener);
        window.addEventListener("localStorage-update", customEventListener);
      }
    }
  };

  // Инициализируем подписку
  setupSubscription();

  // Подписываемся на изменения статуса авторизации
  authUnsubscribe = onAuthChange(() => {
    // При изменении статуса авторизации переподписываемся
    setupSubscription();
  });

  return () => {
    isUnsubscribed = true;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    if (typeof window !== "undefined") {
      if (storageListener) {
        window.removeEventListener("storage", storageListener);
      }
      if (customEventListener) {
        window.removeEventListener("localStorage-update", customEventListener);
      }
    }
  };
};

