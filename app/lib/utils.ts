import type { KeywordMapping, ParsedQuery, StorageData } from "../types";
import { findKeyword, findKeywordSync, loadData } from "./storage/index";

// Constants
const DEFAULT_SEARCH_ENGINE = "https://google.com/search?q=";
const GOOGLE_FAVICON_API = "https://www.google.com/s2/favicons";
const HTTPS_PROTOCOL = "https://";
const HTTP_PROTOCOL = "http://";
const MIN_KEYWORD_LENGTH_FOR_FUZZY = 3;

/**
 * Parse query
 * Splits input text into keyword and query parameters
 * 
 * @param text - query text (e.g., "youtube react tutorial")
 * @returns object with keyword and query parameters
 */
export function parseQuery(text: string): ParsedQuery {
    const trimmed = text.trim();
    
    if (!trimmed) {
        return { keyword: "", query: "" };
    }
    
    const spaceIndex = trimmed.indexOf(" ");
    if (spaceIndex === -1) {
        return { keyword: trimmed.toLowerCase(), query: "" };
    }
    
    return {
        keyword: trimmed.slice(0, spaceIndex).toLowerCase(),
        query: trimmed.slice(spaceIndex + 1).trim()
    };
}

/**
 * Normalize URL (adds protocol if missing)
 * 
 * @param url - URL to normalize
 * @returns normalized URL
 */
export function normalizeUrl(url: string): string {
    if (!url) return "";
    
    // If already a full URL, return as is
    if (url.startsWith(HTTPS_PROTOCOL) || url.startsWith(HTTP_PROTOCOL)) {
        return url;
    }
    
    // If starts with //, add https:
    if (url.startsWith("//")) {
        return `https:${url}`;
    }
    
    // Otherwise add https://
    return `${HTTPS_PROTOCOL}${url}`;
}

/**
 * Validate URL
 * 
 * @param url - URL to validate
 * @returns true if URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
    if (!url) return false;
    
    try {
        const normalized = normalizeUrl(url);
        const parsedUrl = new URL(normalized);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Combine base URL with path
 * 
 * @param base - base URL
 * @param path - path to add
 * @returns combined URL
 */
function buildPath(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${trimmedBase}${normalizedPath}`;
}

/**
 * Resolve target URL for search
 * 
 * @param target - base URL or site description from settings
 * @param searchParamOverride - search parameter (when passing string URL)
 * @returns object with base URL and search parameter
 */
function resolveSearchTarget(
    target: string | KeywordMapping,
    searchParamOverride?: string
): { baseUrl: string; searchParam?: string } {
    if (typeof target === "string") {
        return {
            baseUrl: normalizeUrl(target),
            searchParam: searchParamOverride,
        };
    }
    
    const normalizedBase = normalizeUrl(target.url);
    const baseUrl = target.searchPath
        ? buildPath(normalizedBase, target.searchPath)
        : normalizedBase;
    
    return {
        baseUrl,
        searchParam: target.searchParam ?? searchParamOverride,
    };
}

/**
 * Build URL with search parameters.
 * Can accept either a plain string URL or a `KeywordMapping` object
 * to automatically account for `searchPath` and `searchParam`.
 * 
 * @param target - base URL or site description from settings
 * @param query - search string
 * @param searchParamOverride - search parameter (when passing string URL)
 * @returns URL with search parameters
 */
export function buildSearchUrl(
    target: string | KeywordMapping,
    query: string,
    searchParamOverride?: string
): string {
    if (!query) {
        const { baseUrl } = resolveSearchTarget(target, searchParamOverride);
        return baseUrl;
    }
    
    const { baseUrl, searchParam } = resolveSearchTarget(target, searchParamOverride);
    
    if (!searchParam) {
        return baseUrl;
    }
    
    try {
        const url = new URL(baseUrl);
        url.searchParams.set(searchParam, query);
        return url.toString();
    } catch {
        // If failed to create URL, return base URL
        return baseUrl;
    }
}

/**
 * Get favicon URL via Google API
 * 
 * @param url - site URL
 * @returns favicon URL or empty string on error
 */
export function getFaviconUrl(url: string): string {
    if (!url) return "";
    
    try {
        const urlObj = new URL(normalizeUrl(url));
        return `${GOOGLE_FAVICON_API}?domain=${urlObj.hostname}&sz=64`;
    } catch {
        return "";
    }
}

/**
 * Get default search URL
 * 
 * @param query - search query
 * @param defaultEngine - optional default search engine
 * @returns search URL
 */
function getDefaultSearchUrl(query: string, defaultEngine?: string): string {
    if (defaultEngine) {
        return buildSearchUrl(defaultEngine, query, "q");
    }
    return `${DEFAULT_SEARCH_ENGINE}${encodeURIComponent(query)}`;
}

/**
 * Find keyword using fuzzy matching
 * 
 * @param keywords - list of keywords
 * @param keywordLower - keyword to search for in lowercase
 * @returns found keyword or null
 */
function findFuzzyKeyword(
    keywords: KeywordMapping[],
    keywordLower: string
): KeywordMapping | null {
    // First look for exact start match
    const startsWithMatch = keywords.find(k => 
        k.keyword.toLowerCase().startsWith(keywordLower)
    );
    if (startsWithMatch) return startsWithMatch;
    
    // Then partial match or match in description
    return keywords.find(k => {
        const kLower = k.keyword.toLowerCase();
        return kLower.includes(keywordLower) || 
               k.description?.toLowerCase().includes(keywordLower);
    }) || null;
}

/**
 * Find keyword in data
 * 
 * @param keyword - keyword to search for
 * @param currentData - data to search in
 * @returns found keyword or null
 */
async function findKeywordMapping(
    keyword: string,
    currentData: StorageData
): Promise<KeywordMapping | null> {
    const keywordLower = keyword.toLowerCase();
    
    // First try to find exact match
    let mapping = findKeywordSync(keyword);
    if (!mapping) {
        mapping = await findKeyword(keyword);
    }
    
    // If no exact match, use fuzzy search (only if more than 3 characters)
    if (!mapping && keywordLower.length > MIN_KEYWORD_LENGTH_FOR_FUZZY) {
        mapping = findFuzzyKeyword(currentData.keywords, keywordLower);
    }
    
    return mapping || null;
}

/**
 * Build target URL for found keyword
 * 
 * @param mapping - found keyword
 * @param searchQuery - search query
 * @returns target URL
 */
function buildTargetUrl(mapping: KeywordMapping, searchQuery: string): string {
    if (!searchQuery) {
        return normalizeUrl(mapping.url);
    }
    return buildSearchUrl(mapping, searchQuery);
}

/**
 * Process search query and return redirect URL
 * Universal function for use in SearchBar and SearchPage
 * 
 * @param query - search query (e.g., "youtube react tutorial")
 * @param preloadedData - optional preloaded data (for optimization)
 * @returns Promise with redirect URL or null if query is empty
 */
export async function processSearchQuery(
    query: string,
    preloadedData?: StorageData | null
): Promise<string | null> {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
        return null;
    }

    const { keyword, query: searchQuery } = parseQuery(trimmedQuery);
    
    // If no keyword, use default search
    if (!keyword) {
        return getDefaultSearchUrl(trimmedQuery);
    }

    // Load data if not provided
    let currentData: StorageData;
    if (preloadedData) {
        currentData = preloadedData;
    } else {
        try {
            currentData = await loadData();
        } catch (err) {
            console.error("Error loading data:", err);
            return getDefaultSearchUrl(trimmedQuery);
        }
    }

    // Search for keyword
    const mapping = await findKeywordMapping(keyword, currentData);
    
    // If site not found, use default search
    if (!mapping) {
        return getDefaultSearchUrl(
            trimmedQuery,
            currentData.settings?.defaultSearchEngine
        );
    }
    
    // Build target URL
    return buildTargetUrl(mapping, searchQuery);
}
