/**
 * Interface for storing keywords and URLs
 */
export interface KeywordMapping {
    keyword: string;      // keyword (e.g., "youtube")
    url: string;          // site URL (e.g., "https://youtube.com")
    description?: string;  // description (optional)
    searchPath?: string;   // search path (e.g., "/search" or "/results")
    searchParam?: string;  // search parameter (e.g., "q", "search_query", "k")
}

/**
 * Application settings
 */
export interface AppSettings {
    defaultSearchEngine?: string;  // default search engine for not found queries
}

/**
 * Storage data
 */
export interface StorageData {
    keywords: KeywordMapping[];
    settings?: AppSettings;
}

/**
 * Parsed query result
 */
export interface ParsedQuery {
    keyword: string;      // keyword (first word)
    query: string;        // rest of query (search parameters)
}

