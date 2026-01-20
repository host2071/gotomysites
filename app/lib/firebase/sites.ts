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
  update?: boolean; // Flag allowing site update by user
}

const SITES_COLLECTION = "sites";

/**
 * Create or get existing site
 */
export const getOrCreateSite = async (
  siteData: KeywordMapping
): Promise<string> => {
  if (!db) throw new Error("Firebase not initialized");

  // Check if site with this keyword exists
  const sitesRef = collection(db, SITES_COLLECTION);
  const q = query(sitesRef, where("keyword", "==", siteData.keyword.toLowerCase()));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Site exists
    const existingSiteDoc = querySnapshot.docs[0];
    const existingSite = existingSiteDoc.data() as Site;
    const siteId = existingSiteDoc.id;
    
    // Update usage counter
    await updateDoc(doc(db, SITES_COLLECTION, siteId), {
      usageCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // If update flag is not false, update site data (if new fields are filled)
    if (existingSite.update !== false) {
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };
      
      // Update only filled fields
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
      
      // Update only if there are changes
      if (Object.keys(updateData).length > 1) {
        await updateDoc(doc(db, SITES_COLLECTION, siteId), updateData);
      }
    }
    
    return siteId;
  }

  // Create new site
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
    update: true, // Allow updates by default
  });

  return newSiteRef.id;
};

/**
 * Get site by ID
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
 * Get site by keyword
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
 * Get all popular sites (for public catalog)
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
 * Get popular user sites (filtered by available keywords)
 * @param userKeywords - list of keywords available to user
 * @param limitCount - maximum number of sites
 */
export const getPopularUserSites = async (
  userKeywords: string[],
  limitCount: number = 10
): Promise<Site[]> => {
  if (!db || userKeywords.length === 0) {
    return [];
  }

  try {
    // Get all popular sites
    const popularSites = await getPopularSites(limitCount * 2); // Get more to ensure enough after filtering
    
    // Filter only those available to user (case-insensitive)
    const userKeywordsLower = userKeywords.map(k => k.toLowerCase());
    const filteredSites = popularSites.filter(site => 
      userKeywordsLower.includes(site.keyword.toLowerCase())
    );
    
    // Return sorted by usageCount (already sorted)
    return filteredSites.slice(0, limitCount);
  } catch (error) {
    console.error("Error getting popular user sites:", error);
    return [];
  }
};

/**
 * Remove site (decrease usage counter)
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
 * Update site (only if update flag allows)
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

  // Check update flag
  if (site.update === false) {
    throw new Error("Site is not allowed");
  }

  // Update only provided fields
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
 * Set update flag for site
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

