import type { KeywordMapping, ParsedQuery, StorageData } from "../types";
import { findKeyword, findKeywordSync, loadData } from "./storage/index";

// Константы
const DEFAULT_SEARCH_ENGINE = "https://google.com/search?q=";
const GOOGLE_FAVICON_API = "https://www.google.com/s2/favicons";
const HTTPS_PROTOCOL = "https://";
const HTTP_PROTOCOL = "http://";
const MIN_KEYWORD_LENGTH_FOR_FUZZY = 3;

/**
 * Парсинг запроса
 * Разделяет введенный текст на ключевое слово и параметры запроса
 * 
 * @param text - текст запроса (например, "youtube react tutorial")
 * @returns объект с ключевым словом и параметрами запроса
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
 * Нормализация URL (добавляет протокол если отсутствует)
 * 
 * @param url - URL для нормализации
 * @returns нормализованный URL
 */
export function normalizeUrl(url: string): string {
    if (!url) return "";
    
    // Если уже полный URL, вернуть как есть
    if (url.startsWith(HTTPS_PROTOCOL) || url.startsWith(HTTP_PROTOCOL)) {
        return url;
    }
    
    // Если начинается с //, добавить https:
    if (url.startsWith("//")) {
        return `https:${url}`;
    }
    
    // Иначе добавить https://
    return `${HTTPS_PROTOCOL}${url}`;
}

/**
 * Валидация URL
 * 
 * @param url - URL для валидации
 * @returns true если URL валиден, false иначе
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
 * Объединение базового URL с путем
 * 
 * @param base - базовый URL
 * @param path - путь для добавления
 * @returns объединенный URL
 */
function buildPath(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${trimmedBase}${normalizedPath}`;
}

/**
 * Разрешение целевого URL для поиска
 * 
 * @param target - базовый URL или описание сайта из настроек
 * @param searchParamOverride - параметр поиска (при передаче строкового URL)
 * @returns объект с базовым URL и параметром поиска
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
 * Формирование URL с параметрами поиска.
 * Может принимать как обычную строку URL, так и объект `KeywordMapping`,
 * чтобы автоматически учитывать `searchPath` и `searchParam`.
 * 
 * @param target - базовый URL или описание сайта из настроек
 * @param query - поисковая строка
 * @param searchParamOverride - параметр поиска (при передаче строкового URL)
 * @returns URL с параметрами поиска
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
        // Если не удалось создать URL, возвращаем базовый
        return baseUrl;
    }
}

/**
 * Получение URL для favicon через Google API
 * 
 * @param url - URL сайта
 * @returns URL favicon или пустую строку при ошибке
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
 * Получение URL поиска по умолчанию
 * 
 * @param query - поисковый запрос
 * @param defaultEngine - опциональный поисковик по умолчанию
 * @returns URL для поиска
 */
function getDefaultSearchUrl(query: string, defaultEngine?: string): string {
    if (defaultEngine) {
        return buildSearchUrl(defaultEngine, query, "q");
    }
    return `${DEFAULT_SEARCH_ENGINE}${encodeURIComponent(query)}`;
}

/**
 * Поиск ключевого слова с использованием нечеткого совпадения
 * 
 * @param keywords - список ключевых слов
 * @param keywordLower - искомое ключевое слово в нижнем регистре
 * @returns найденное ключевое слово или null
 */
function findFuzzyKeyword(
    keywords: KeywordMapping[],
    keywordLower: string
): KeywordMapping | null {
    // Сначала ищем точное совпадение начала
    const startsWithMatch = keywords.find(k => 
        k.keyword.toLowerCase().startsWith(keywordLower)
    );
    if (startsWithMatch) return startsWithMatch;
    
    // Затем частичное совпадение или совпадение в описании
    return keywords.find(k => {
        const kLower = k.keyword.toLowerCase();
        return kLower.includes(keywordLower) || 
               k.description?.toLowerCase().includes(keywordLower);
    }) || null;
}

/**
 * Поиск ключевого слова в данных
 * 
 * @param keyword - искомое ключевое слово
 * @param currentData - данные для поиска
 * @returns найденное ключевое слово или null
 */
async function findKeywordMapping(
    keyword: string,
    currentData: StorageData
): Promise<KeywordMapping | null> {
    const keywordLower = keyword.toLowerCase();
    
    // Сначала пытаемся найти точное совпадение
    let mapping = findKeywordSync(keyword);
    if (!mapping) {
        mapping = await findKeyword(keyword);
    }
    
    // Если точного совпадения нет, используем нечеткий поиск (только если больше 3 букв)
    if (!mapping && keywordLower.length > MIN_KEYWORD_LENGTH_FOR_FUZZY) {
        mapping = findFuzzyKeyword(currentData.keywords, keywordLower);
    }
    
    return mapping || null;
}

/**
 * Формирование целевого URL для найденного ключевого слова
 * 
 * @param mapping - найденное ключевое слово
 * @param searchQuery - поисковый запрос
 * @returns целевой URL
 */
function buildTargetUrl(mapping: KeywordMapping, searchQuery: string): string {
    if (!searchQuery) {
        return normalizeUrl(mapping.url);
    }
    return buildSearchUrl(mapping, searchQuery);
}

/**
 * Обработка поискового запроса и возврат URL для перенаправления
 * Универсальная функция для использования в SearchBar и SearchPage
 * 
 * @param query - поисковый запрос (например, "youtube react tutorial")
 * @param preloadedData - опциональные предзагруженные данные (для оптимизации)
 * @returns Promise с URL для перенаправления или null, если запрос пустой
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
    
    // Если нет ключевого слова, используем поиск по умолчанию
    if (!keyword) {
        return getDefaultSearchUrl(trimmedQuery);
    }

    // Загружаем данные, если не были переданы
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

    // Ищем ключевое слово
    const mapping = await findKeywordMapping(keyword, currentData);
    
    // Если сайт не найден, используем поиск по умолчанию
    if (!mapping) {
        return getDefaultSearchUrl(
            trimmedQuery,
            currentData.settings?.defaultSearchEngine
        );
    }
    
    // Формируем целевой URL
    return buildTargetUrl(mapping, searchQuery);
}
