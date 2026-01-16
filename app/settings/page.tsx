"use client";

import { useState, useEffect, FormEvent } from "react";
import { getKeywords, addKeyword, removeKeyword, subscribeToDataChanges } from "../lib/storage/index";
import { getCurrentUser } from "../lib/firebase/auth";
import { isValidUrl, normalizeUrl, getFaviconUrl } from "../lib/utils";
import type { KeywordMapping } from "../types";
import Link from "next/link";
import { getSiteByKeyword } from "../lib/firebase/sites";

export default function SettingsPage() {
    const [keywords, setKeywords] = useState<KeywordMapping[]>([]);
    const [keyword, setKeyword] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [searchPath, setSearchPath] = useState("");
    const [searchParam, setSearchParam] = useState("");
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [error, setError] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadKeywords();
        
        // Подписываемся на изменения в Firebase
        const unsubscribe = subscribeToDataChanges((data) => {
            if (data) {
                setKeywords(data.keywords || []);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const loadKeywords = async () => {
        try {
            const data = await getKeywords();
            setKeywords(data);
        } catch (err) {
            console.error("Error loading keywords:", err);
            setError("Ошибка загрузки данных");
        }
    };

    const guessSearchParamFromUrl = (urlObj: URL): string | null => {
        const preferred = ["q", "query", "search", "search_query", "k", "ss", "text", "s"];
        for (const key of preferred) {
            if (urlObj.searchParams.has(key)) return key;
        }
        // fallback: первый параметр с непустым значением
        for (const [k, v] of urlObj.searchParams.entries()) {
            if (v) return k;
        }
        return null;
    };

    const labelFromDomain = (hostname: string): string => {
        const base = hostname.replace(/^www\./, "");
        return base
            .split(".")[0]
            .replace(/[^a-z0-9-]/gi, " ")
            .replace(/\b\w/g, (m) => m.toUpperCase());
    };

    const handleParse = async () => {
        setError("");
        const rawUrl = url.trim();
        
        if (!rawUrl) {
            setError("Введите URL для парсинга");
            return;
        }

        if (!isValidUrl(rawUrl)) {
            setError("Некорректный формат URL");
            return;
        }

        const normalized = normalizeUrl(rawUrl);
        try {
            const urlObj = new URL(normalized);
            // Определяем параметры
            const origin = urlObj.origin;
            const path = urlObj.pathname && urlObj.pathname !== "/" ? urlObj.pathname : "";
            const param = guessSearchParamFromUrl(urlObj) || "";
            const hostname = urlObj.hostname;
            const suggestedKeyword = hostname.replace(/^www\./, "").split(".")[0].toLowerCase();
            const suggestedDescription = labelFromDomain(hostname);

            // Проверяем, есть ли сайт с таким keyword в базе Firebase
            try {
                const existingSite = await getSiteByKeyword(suggestedKeyword);
                if (existingSite) {
                    // Используем данные из базы
                    setKeyword(existingSite.keyword);
                    setUrl(existingSite.url);
                    setDescription(existingSite.description || suggestedDescription);
                    setSearchPath(existingSite.searchPath || path);
                    setSearchParam(existingSite.searchParam || param);
                    setShowAdvancedFields(true);
                    setError("");
                    return;
                }
            } catch (firebaseError) {
                // Если Firebase не инициализирован или произошла ошибка, продолжаем с парсингом
                console.warn("Firebase error:", firebaseError);
            }

            // Если сайта нет в базе, используем данные из парсинга
            setSearchPath(path);
            setSearchParam(param);
            setKeyword(suggestedKeyword);
            setDescription(suggestedDescription);
            setUrl(origin); // только домен
            setShowAdvancedFields(true);
            setError("");
        } catch {
            setError("Ошибка при парсинге URL");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (!keyword.trim()) {
            setError("Введите ключевое слово");
            return;
        }

        if (!url.trim()) {
            setError("Введите URL");
            return;
        }

        if (!isValidUrl(url)) {
            setError("Некорректный URL");
            return;
        }

        const normalizedUrl = normalizeUrl(url);
        let originOnly = normalizedUrl;
        try {
            const parsed = new URL(normalizedUrl);
            originOnly = parsed.origin;
        } catch {
            // fallback
        }

        const mapping: KeywordMapping = {
            keyword: keyword.trim().toLowerCase(),
            url: originOnly,
            description: description.trim() || undefined,
            searchPath: searchPath.trim() || undefined,
            searchParam: searchParam.trim() || undefined,
        };

        setIsAdding(true);
        try {
            await addKeyword(mapping);
            
            // Проверяем, что данные действительно добавились
            // Для авторизованных проверяем Firebase, для неавторизованных - localStorage
            const user = await getCurrentUser();
            if (user) {
                // Для авторизованных: ждем, пока данные появятся в Firebase
                let attempts = 0;
                const maxAttempts = 15;
                let dataAdded = false;
                
                while (attempts < maxAttempts && !dataAdded) {
                    const currentKeywords = await getKeywords();
                    const added = currentKeywords.find(
                        k => k.keyword.toLowerCase() === mapping.keyword.toLowerCase()
                    );
                    if (added) {
                        dataAdded = true;
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
                
                if (!dataAdded) {
                    throw new Error("Данные не были добавлены на сервер");
                }
            }
            // Для неавторизованных: данные уже в localStorage, проверка не требуется
            
            // Очистка формы
            setKeyword("");
            setUrl("");
            setDescription("");
            setSearchPath("");
            setSearchParam("");
            setShowAdvancedFields(false);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ошибка при добавлении сайта");
            console.error("Error adding keyword:", err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (keywordToDelete: string) => {
        if (confirm(`Удалить ключевое слово "${keywordToDelete}"?`)) {
            try {
                await removeKeyword(keywordToDelete);
                // Данные обновятся автоматически через подписку
            } catch (err) {
                setError("Ошибка при удалении сайта");
                console.error("Error removing keyword:", err);
            }
        }
    };

    return (
        <div className="settings-container">
            <header className="settings-header">
                <Link href="/" className="back-link">
                    ← Назад
                </Link>
                <h1>Настройки</h1>
            </header>

            <div className="settings-content">
                <section className="settings-section">
                    <h2>Добавить сайт</h2>
                    <form onSubmit={handleSubmit} className="settings-form">
                        <div className="form-group">
                            <label htmlFor="url">URL:</label>
                            <div className="input-with-button">
                                <input
                                    id="url"
                                    type="text"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        // Скрываем поля при изменении URL
                                        if (showAdvancedFields) {
                                            setShowAdvancedFields(false);
                                        }
                                    }}
                                    placeholder="https://youtube.com/search?q=query"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleParse}
                                    className="parse-button"
                                    title="Парсить URL и автоматически заполнить поля"
                                >
                                    Parse
                                </button>
                            </div>
                            <small className="form-hint">
                                💡 Совет: нажмите Parse для автоматического заполнения полей из URL
                            </small>
                        </div>
                        {showAdvancedFields && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="keyword">Ключевое слово:</label>
                                    <input
                                        id="keyword"
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="youtube"
                                        required
                                    />
                                    <small className="form-hint">
                                        Слово для ввода в адресной строке (например, youtube)
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description">Описание (необязательно):</label>
                                    <input
                                        id="description"
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="YouTube"
                                    />
                                    <small className="form-hint">
                                        Название сайта для отображения в попапе
                                    </small>
                                </div>
                            </>
                        )}
                        {showAdvancedFields && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="search-path">Путь для поиска (необязательно):</label>
                                    <input
                                        id="search-path"
                                        type="text"
                                        value={searchPath}
                                        onChange={(e) => setSearchPath(e.target.value)}
                                        placeholder="/search или /results"
                                    />
                                    <small className="form-hint">
                                        Путь на сайте для поиска (например, /search, /results)
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="search-param">Параметр поиска (например, q, search_query, k):</label>
                                    <input
                                        id="search-param"
                                        type="text"
                                        value={searchParam}
                                        onChange={(e) => setSearchParam(e.target.value)}
                                        placeholder="q"
                                    />
                                    <small className="form-hint">
                                        Параметр запроса для поиска (например, q для Google, search_query для YouTube)
                                    </small>
                                </div>
                            </>
                        )}
                        {error && <div className="error-message">{error}</div>}
                        <button 
                            type="submit" 
                            className="submit-button" 
                            disabled={isAdding}
                        >
                            {isAdding && <div className="spinner"></div>}
                            {isAdding ? "Сохранение..." : "Добавить"}
                        </button>
                    </form>
                </section>

                <section className="settings-section">
                    <h2>Сохраненные сайты</h2>
                    {keywords.length === 0 ? (
                        <p className="empty-message">Нет сохраненных сайтов</p>
                    ) : (
                        <div className="keywords-list">
                            {keywords.map((item) => (
                                <div key={item.keyword} className="keyword-item">
                                    <div className="keyword-icon">
                                        <img
                                            src={getFaviconUrl(item.url)}
                                            alt={item.keyword}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                const letter = target.nextElementSibling as HTMLElement;
                                                if (letter) letter.style.display = "block";
                                            }}
                                        />
                                        <span className="icon-letter" style={{ display: "none" }}>
                                            {item.keyword.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="keyword-info">
                                        <div className="keyword-label">{item.keyword}</div>
                                        <div className="keyword-url">{item.url}</div>
                                        {item.description && (
                                            <div className="keyword-description">{item.description}</div>
                                        )}
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(item.keyword)}
                                        title="Удалить"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}


