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
 * Load user data
 * For authenticated users - first from localStorage (fast), then sync with Firebase in background
 * For unauthenticated users - from localStorage
 */
export const loadData = async (): Promise<StorageData> => {
  const user = await getCurrentUser();
  
  if (!user) {
    // Unauthenticated user - use localStorage
    return loadLocalData();
  }

  // Authenticated user - first return data from localStorage (fast)
  const localData = loadLocalData();
  
  // Then sync with Firebase in background (non-blocking)
  syncFromCloud(user).then((cloudData) => {
    if (cloudData) {
      const storageData: StorageData = {
        keywords: cloudData.keywords,
        settings: cloudData.settings || {
          defaultSearchEngine: "https://google.com/search?q=",
        },
      };
      // Update localStorage with data from Firebase
      saveLocalData(storageData);
      if (cloudData.order) {
        saveLocalOrder(cloudData.order);
      }
    }
  }).catch((error) => {
    console.error("Error syncing from cloud:", error);
  });

  // Return data from localStorage immediately
  return localData;
};

/**
 * Save data
 * For authenticated users - to Firebase and localStorage, for unauthenticated - to localStorage
 */
export const saveData = async (data: StorageData): Promise<void> => {
  const user = await getCurrentUser();
  
  // Always save to localStorage for fast access
  saveLocalData(data);
  // Dispatch event to update in current tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Unauthenticated user - only localStorage
    return;
  }

  // Authenticated user - also save to Firebase
  const { syncToCloud } = await import("../firebase/sync");
  try {
    await syncToCloud(user, data.keywords, [], data.settings);
  } catch (error) {
    console.error("Error syncing to cloud:", error);
  }
};

/**
 * Get keywords list
 * For authenticated users - first from localStorage (fast), then sync with Firebase in background
 * For unauthenticated users - from localStorage
 */
export const getKeywords = async (): Promise<KeywordMapping[]> => {
  const user = await getCurrentUser();
  
  // Always return from localStorage for fast access
  const localKeywords = getLocalKeywords();
  
  if (user) {
    // Authenticated user - sync with Firebase in background
    syncFromCloud(user).then((cloudData) => {
      if (cloudData && cloudData.keywords.length > 0) {
        // Update localStorage with data from Firebase
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
 * Synchronous version for fast access
 * Always returns data from localStorage
 */
export const getKeywordsSync = (): KeywordMapping[] => {
  return getLocalKeywords();
};

/**
 * Add keyword
 * For authenticated users - to Firebase and localStorage, for unauthenticated - to localStorage
 */
export const addKeyword = async (keyword: KeywordMapping): Promise<void> => {
  const user = await getCurrentUser();
  
  // Always save to localStorage for fast access
  addLocalKeyword(keyword);
  // Dispatch event to update in current tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Unauthenticated user - only localStorage
    return;
  }

  // Authenticated user - also save to Firebase
  try {
    await addSiteToUser(user, keyword);
  } catch (error) {
    console.error("Error adding keyword to cloud:", error);
  }
};

/**
 * Remove keyword
 * For authenticated users - from Firebase and localStorage, for unauthenticated - from localStorage
 */
export const removeKeyword = async (keyword: string): Promise<void> => {
  const user = await getCurrentUser();
  
  // Always remove from localStorage for fast access
  removeLocalKeyword(keyword);
  // Dispatch event to update in current tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Unauthenticated user - only localStorage
    return;
  }

  // Authenticated user - also remove from Firebase
  try {
    await removeSiteFromUser(user, keyword);
  } catch (error) {
    console.error("Error removing keyword from cloud:", error);
  }
};

/**
 * Find keyword
 * Always searches in localStorage for fast access
 */
export const findKeyword = async (keyword: string): Promise<KeywordMapping | null> => {
  // Use synchronous version for fast search
  return findLocalKeyword(keyword);
};

/**
 * Synchronous version for unauthenticated users
 */
export const findKeywordSync = (keyword: string): KeywordMapping | null => {
  return findLocalKeyword(keyword);
};

/**
 * Get site order
 * Always from localStorage for fast access
 */
export const getOrder = async (): Promise<string[]> => {
  return getLocalOrder() || [];
};

/**
 * Save site order
 * For authenticated users - to Firebase and localStorage, for unauthenticated - to localStorage
 */
export const saveOrder = async (order: string[]): Promise<void> => {
  const user = await getCurrentUser();
  
  // Always save to localStorage for fast access
  saveLocalOrder(order);
  // Dispatch event to update in current tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("localStorage-update"));
  }
  
  if (!user) {
    // Unauthenticated user - only localStorage
    return;
  }

  // Authenticated user - also save to Firebase
  try {
    await updateUserOrder(user, order);
  } catch (error) {
    console.error("Error updating order in cloud:", error);
  }
};

/**
 * Subscribe to user data changes
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

    // Unsubscribe from previous subscription if exists
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    // Remove previous localStorage listeners
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
      // Authenticated user - subscribe to Firebase changes
      unsubscribe = subscribeToUserChanges(user, (cloudData) => {
        if (isUnsubscribed) return;

        if (cloudData) {
          // Update localStorage when data changes in Firebase
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
          // Dispatch event to update UI
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("localStorage-update"));
          }
        }
        // Call callback to update UI
        callback(cloudData);
      });
    } else {
      // Unauthenticated user - return data from localStorage
      updateLocalData();
      
      // Subscribe to localStorage changes (for updates in other tabs and current)
      if (typeof window !== "undefined") {
        storageListener = (e: Event) => {
          if (isUnsubscribed) return;
          const storageEvent = e as StorageEvent;
          // Event from other tabs
          if (storageEvent.key === "goWebsiteLauncherData" || storageEvent.key === "goWebsiteLauncherOrder") {
            updateLocalData();
          }
        };
        
        customEventListener = () => {
          if (isUnsubscribed) return;
          // Custom event from current tab
          updateLocalData();
        };
        
        window.addEventListener("storage", storageListener);
        window.addEventListener("localStorage-update", customEventListener);
      }
    }
  };

  // Initialize subscription
  setupSubscription();

  // Subscribe to auth status changes
  authUnsubscribe = onAuthChange(() => {
    // When auth status changes, resubscribe
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

