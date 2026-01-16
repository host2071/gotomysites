"use client";

import { getCurrentUser, onAuthChange } from "../firebase/auth";
import {
  syncFromCloud,
  subscribeToUserChanges,
  addSiteToUser,
  removeSiteFromUser,
  updateUserOrder,
} from "../firebase/sync";
import {
  loadData as loadLocalData,
  saveData as saveLocalData,
  getOrder as getLocalOrder,
  saveOrder as saveLocalOrder,
} from "./local";
import type { KeywordMapping, StorageData } from "../../types";
import { User } from "firebase/auth";

let unsubscribeAuth: (() => void) | null = null;
let unsubscribeSync: (() => void) | null = null;

export const initializeSync = () => {
  unsubscribeAuth = onAuthChange(async (user) => {
    if (unsubscribeSync) {
      unsubscribeSync();
      unsubscribeSync = null;
    }

    if (user) {
      // Загружаем данные из Firebase и сохраняем в localStorage при первом входе
      try {
        const cloudData = await syncFromCloud(user);
        if (cloudData) {
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
      } catch (error) {
        console.error("Error syncing from cloud on auth:", error);
      }

      // Подписываемся на изменения в Firebase
      unsubscribeSync = subscribeToUserChanges(user, (cloudData) => {
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
        // Вызываем событие синхронизации для обновления UI
        window.dispatchEvent(
          new CustomEvent("storage-sync", { detail: cloudData })
        );
      });
    }
  });
};

export const syncAddKeyword = async (keyword: KeywordMapping): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await addSiteToUser(user, keyword);
  } catch (error) {
    console.error("Error adding keyword to cloud:", error);
  }
};

export const syncRemoveKeyword = async (keyword: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await removeSiteFromUser(user, keyword);
  } catch (error) {
    console.error("Error removing keyword from cloud:", error);
  }
};

export const syncUpdateOrder = async (order: string[]): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) return;

  try {
    await updateUserOrder(user, order);
  } catch (error) {
    console.error("Error updating order in cloud:", error);
  }
};

export const cleanupSync = () => {
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
  if (unsubscribeSync) {
    unsubscribeSync();
    unsubscribeSync = null;
  }
};

