import type { KeywordMapping, StorageData } from "../../types";

const STORAGE_KEY = "goWebsiteLauncherData";
const ORDER_KEY = "goWebsiteLauncherOrder";

/**
 * Default set of popular websites
 */
const DEFAULT_KEYWORDS: KeywordMapping[] = [
    { 
        keyword: "google", 
        url: "https://google.com", 
        description: "Google", 
        searchPath: "/search", 
        searchParam: "q" 
    },
    { 
        keyword: "youtube", 
        url: "https://youtube.com", 
        description: "YouTube", 
        searchPath: "/results", 
        searchParam: "search_query" 
    },
];

/**
 * Initialize storage with default values
 */
function initializeStorage(): void {
    if (typeof window === "undefined") return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
        const defaultData: StorageData = {
            keywords: DEFAULT_KEYWORDS,
            settings: {
                defaultSearchEngine: "https://google.com/search?q=",
            },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    }
}

/**
 * Load data from localStorage
 */
export function loadData(): StorageData {
    if (typeof window === "undefined") {
        return {
            keywords: DEFAULT_KEYWORDS,
            settings: {
                defaultSearchEngine: "https://google.com/search?q=",
            },
        };
    }
    
    initializeStorage();
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
        return {
            keywords: DEFAULT_KEYWORDS,
            settings: {
                defaultSearchEngine: "https://google.com/search?q=",
            },
        };
    }
    
    try {
        return JSON.parse(stored) as StorageData;
    } catch {
        return {
            keywords: DEFAULT_KEYWORDS,
            settings: {
                defaultSearchEngine: "https://google.com/search?q=",
            },
        };
    }
}

/**
 * Save data to localStorage
 */
export function saveData(data: StorageData): void {
    if (typeof window === "undefined") return;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get keywords list
 */
export function getKeywords(): KeywordMapping[] {
    const data = loadData();
    return data.keywords || [];
}

/**
 * Add or update keyword
 */
export function addKeyword(keyword: KeywordMapping): void {
    const data = loadData();
    // Check duplicate
    const existingIndex = data.keywords.findIndex(
        k => k.keyword.toLowerCase() === keyword.keyword.toLowerCase()
    );
    
    if (existingIndex >= 0) {
        // Update existing
        data.keywords[existingIndex] = keyword;
    } else {
        // Add new
        data.keywords.push(keyword);
    }
    
    saveData(data);
}

/**
 * Remove keyword
 */
export function removeKeyword(keyword: string): void {
    const data = loadData();
    data.keywords = data.keywords.filter(
        k => k.keyword.toLowerCase() !== keyword.toLowerCase()
    );
    saveData(data);
}

/**
 * Find keyword by name
 */
export function findKeyword(keyword: string): KeywordMapping | null {
    const keywords = getKeywords();
    const found = keywords.find(
        k => k.keyword.toLowerCase() === keyword.toLowerCase()
    );
    return found || null;
}

/**
 * Get order from localStorage
 */
export function getOrder(): string[] | null {
    if (typeof window === "undefined") return null;
    
    const stored = localStorage.getItem(ORDER_KEY);
    if (!stored) return null;
    
    try {
        return JSON.parse(stored) as string[];
    } catch {
        return null;
    }
}

/**
 * Save order to localStorage
 */
export function saveOrder(order: string[]): void {
    if (typeof window === "undefined") return;
    
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
}

