/**
 * Интерфейс для хранения ключевых слов и URL
 */
export interface KeywordMapping {
    keyword: string;      // ключевое слово (например, "youtube")
    url: string;          // URL сайта (например, "https://youtube.com")
    description?: string;  // описание (опционально)
    searchPath?: string;   // путь для поиска (например, "/search" или "/results")
    searchParam?: string;  // параметр поиска (например, "q", "search_query", "k")
}

/**
 * Настройки приложения
 */
export interface AppSettings {
    defaultSearchEngine?: string;  // поисковик по умолчанию для не найденных запросов
}

/**
 * Данные в хранилище
 */
export interface StorageData {
    keywords: KeywordMapping[];
    settings?: AppSettings;
}

/**
 * Результат парсинга запроса
 */
export interface ParsedQuery {
    keyword: string;      // ключевое слово (первое слово)
    query: string;        // остальная часть запроса (параметры поиска)
}

