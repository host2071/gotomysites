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
 * Removes fields with undefined values from object
 * Firebase does not support undefined values
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
 * Sync user data to cloud
 */
export const syncToCloud = async (
  user: User,
  keywords: KeywordMapping[],
  order: string[] = [],
  settings?: any
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);

  // Remove duplicates by keyword (case-insensitive)
  const uniqueKeywords = keywords.filter((keyword, index, self) =>
    index === self.findIndex((k) => k.keyword.toLowerCase() === keyword.keyword.toLowerCase())
  );

  // Convert keywords to UserSite with siteId
  const userSites: UserSite[] = await Promise.all(
    uniqueKeywords.map(async (keyword) => {
      // Get or create site in sites collection
      const siteId = await getOrCreateSite(keyword);
      
      // Check if site exists in database to use data from there
      const existingSite = await getSiteByKeyword(keyword.keyword.toLowerCase());
      
      // If site exists in database, use data from database, otherwise use provided data
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

      // Remove undefined fields before returning
      return removeUndefinedFields(userSite) as UserSite;
    })
  );

  // Always create/update user document
  // merge: true ensures document will be created if it doesn't exist
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
 * Load user data from cloud
 */
export const syncFromCloud = async (
  user: User
): Promise<{ keywords: KeywordMapping[]; order: string[]; settings?: any } | null> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data() as UserData;
    
    // Convert UserSite back to KeywordMapping
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
 * Add site to user
 */
export const addSiteToUser = async (
  user: User,
  keyword: KeywordMapping
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);
  
  // Get or create site in sites collection
  const siteId = await getOrCreateSite(keyword);
  
  // Check if site exists in database
  const existingSiteInDb = await getSiteByKeyword(keyword.keyword.toLowerCase());

  // Check if user already has a site with this keyword
  if (userDoc.exists()) {
    const data = userDoc.data() as UserData;
    const existingUserSite = data.sites.find(
      (s) => s.keyword.toLowerCase() === keyword.keyword.toLowerCase()
    );
    
    // If site already exists for user, update its data (if new fields are filled)
    if (existingUserSite) {
      const updatedUserSite: Partial<UserSite> = {
        siteId: existingUserSite.siteId,
        keyword: existingUserSite.keyword,
        url: existingUserSite.url,
        description: existingUserSite.description,
        searchPath: existingUserSite.searchPath,
        searchParam: existingUserSite.searchParam,
      };
      
      // Update only filled fields from provided data
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
      
      // Remove old site and add updated one
      await updateDoc(userRef, {
        sites: arrayRemove(existingUserSite),
        syncedAt: serverTimestamp(),
      });
      
      const newUserSite = removeUndefinedFields({
        ...updatedUserSite,
        addedAt: existingUserSite.addedAt, // Preserve original add date
      }) as UserSite;
      
      await updateDoc(userRef, {
        sites: arrayUnion(newUserSite),
        syncedAt: serverTimestamp(),
      });
      
      return;
    }
  }

  // If site exists in database, use data from database, otherwise use provided data
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

  // Remove undefined fields before saving to Firebase
  const userSite = removeUndefinedFields(userSiteRaw) as UserSite;

  // If document doesn't exist, create it
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
    // If document exists, update it
    await updateDoc(userRef, {
      sites: arrayUnion(userSite),
      syncedAt: serverTimestamp(),
    });
  }
};

/**
 * Remove site from user
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
      // Remove from user array
      await updateDoc(userRef, {
        sites: arrayRemove(siteToRemove),
        syncedAt: serverTimestamp(),
      });

      // Decrease site usage counter
      await removeSiteUsage(siteToRemove.siteId);
    }
  }
};

/**
 * Update user site order
 */
export const updateUserOrder = async (
  user: User,
  order: string[]
): Promise<void> => {
  if (!db) throw new Error("Firebase not initialized");

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userDoc = await getDoc(userRef);

  // If document doesn't exist, create it
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
    // If document exists, update it
    await updateDoc(userRef, {
      order,
      syncedAt: serverTimestamp(),
    });
  }
};

/**
 * Subscribe to user data changes
 */
export const subscribeToUserChanges = (
  user: User,
  callback: (data: { keywords: KeywordMapping[]; order: string[]; settings?: any } | null) => void
): (() => void) => {
  if (!db) {
    return () => {};
  }

  const userRef = doc(db, USERS_COLLECTION, user.uid);

  return onSnapshot(
    userRef,
    async (docSnap) => {
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
    },
    (error) => {
      // Handle access errors (e.g., after logout)
      if (error.code === 'permission-denied') {
        // User is no longer authenticated - return null and don't show error
        callback(null);
        return;
      }
      // For other errors, log but don't interrupt work
      console.error("Error in snapshot listener:", error);
    }
  );
};

