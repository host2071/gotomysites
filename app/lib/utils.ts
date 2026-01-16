import type { KeywordMapping, ParsedQuery, StorageData } from "../types";
import { findKeyword, findKeywordSync, loadData } from "./storage/index";

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
    
    const parts = trimmed.split(/\s+/);
    const keyword = parts[0].toLowerCase();
    const query = parts.slice(1).join(" ").trim();
    
    return { keyword, query };
}

/**
 * Валидация URL
 * 
 * @param url - URL для валидации
 * @returns true если URL валиден, false иначе
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        // Если URL не содержит протокол, попробуем добавить https://
        try {
            const urlWithProtocol = url.startsWith("//") ? `https:${url}` : `https://${url}`;
            new URL(urlWithProtocol);
            return true;
        } catch {
            return false;
        }
    }
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
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    
    // Если начинается с //, добавить https:
    if (url.startsWith("//")) {
        return `https:${url}`;
    }
    
    // Иначе добавить https://
    return `https://${url}`;
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
    const { baseUrl, searchParam } = resolveSearchTarget(target, searchParamOverride);
    
    if (!query || !searchParam) {
        return baseUrl;
    }
    
    const url = new URL(baseUrl);
    url.searchParams.set(searchParam, query);
    return url.toString();
}

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

function buildPath(base: string, path: string): string {
    const trimmedBase = base.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${trimmedBase}${normalizedPath}`;
}

/**
 * Получение URL для favicon через Google API
 * 
 * @param url - URL сайта
 * @returns URL favicon
 */
export function getFaviconUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
        return "";
    }
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
        return `https://google.com/search?q=${encodeURIComponent(trimmedQuery)}`;
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
            // Fallback на Google поиск
            return `https://google.com/search?q=${encodeURIComponent(trimmedQuery)}`;
        }
    }

    const keywordLower = keyword.toLowerCase();
    
    // Сначала пытаемся найти точное совпадение
    // Для неавторизованных используем синхронную версию
    let mapping = findKeywordSync(keyword);
    if (!mapping) {
        // Если не нашли синхронно, пробуем асинхронно (для авторизованных)
        mapping = await findKeyword(keyword);
    }
    
    // Если точного совпадения нет, ищем по первым буквам
    if (!mapping) {
        const matches = currentData.keywords
            .filter(k => {
                const kLower = k.keyword.toLowerCase();
                return kLower.startsWith(keywordLower) || 
                       kLower.includes(keywordLower) ||
                       k.description?.toLowerCase().includes(keywordLower);
            });
        
        if (matches.length > 0) {
            mapping = matches[0];
        }
    }
    
    // Если сайт не найден, используем поиск по умолчанию
    if (!mapping) {
        if (currentData.settings?.defaultSearchEngine) {
            return buildSearchUrl(
                currentData.settings.defaultSearchEngine,
                trimmedQuery,
                "q"
            );
        } else {
            // Fallback на Google поиск
            return `https://google.com/search?q=${encodeURIComponent(trimmedQuery)}`;
        }
    }
    
    // Формируем URL
    let targetUrl = normalizeUrl(mapping.url);
    
    if (searchQuery) {
        targetUrl = buildSearchUrl(mapping, searchQuery);
    }
    
    return targetUrl;
}

