"use client";

import { useState, useEffect, FormEvent } from "react";
import { getKeywords, addKeyword, removeKeyword, subscribeToDataChanges } from "../lib/storage/index";
import { getCurrentUser, logout } from "../lib/firebase/auth";
import { isValidUrl, normalizeUrl, getFaviconUrl } from "../lib/utils";
import { resetLocalStorage } from "../lib/storage/local";
import type { KeywordMapping } from "../types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSiteByKeyword } from "../lib/firebase/sites";

export default function SettingsPage() {
    const router = useRouter();
    const [keywords, setKeywords] = useState<KeywordMapping[]>([]);
    const [keyword, setKeyword] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [searchPath, setSearchPath] = useState("");
    const [searchParam, setSearchParam] = useState("");
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [error, setError] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        loadKeywords();
        
        // Проверяем авторизацию
        getCurrentUser().then((user) => {
            setIsAuthenticated(!!user);
        });
        
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

    const handleLogout = async () => {
        try {
            await logout();
            // Сбрасываем localStorage к начальным настройкам
            resetLocalStorage();
            router.push("/");
        } catch (err) {
            setError("Ошибка при выходе из аккаунта");
            console.error("Error logging out:", err);
        }
    };

    return (
        <div className="min-h-screen px-5 py-20 max-w-[800px] mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/" className="text-[var(--google-blue)] no-underline text-sm transition-opacity hover:opacity-80">
                    ← Назад
                </Link>
                <h1 className="text-[32px] font-normal m-0 text-[var(--text)]">Настройки</h1>
            </header>

            <div className="flex flex-col gap-8">
                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-xl font-normal m-0 mb-5 text-[var(--text)]">Добавить сайт</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="url" className="text-sm font-medium text-[var(--text)]">URL:</label>
                            <div className="flex gap-2 items-start">
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
                                    className="flex-1 px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                />
                                <button
                                    type="button"
                                    onClick={handleParse}
                                    className="px-5 py-3 bg-[var(--google-blue)] text-white border-none rounded text-sm font-medium cursor-pointer transition-colors hover:bg-[#3367d6] whitespace-nowrap"
                                    title="Парсить URL и автоматически заполнить поля"
                                >
                                    Parse
                                </button>
                            </div>
                            <small className="text-xs text-[var(--text-secondary)] mt-1">
                                💡 Совет: нажмите Parse для автоматического заполнения полей из URL
                            </small>
                        </div>
                        {showAdvancedFields && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="keyword" className="text-sm font-medium text-[var(--text)]">Ключевое слово:</label>
                                    <input
                                        id="keyword"
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="youtube"
                                        required
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Слово для ввода в адресной строке (например, youtube)
                                    </small>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="description" className="text-sm font-medium text-[var(--text)]">Описание (необязательно):</label>
                                    <input
                                        id="description"
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="YouTube"
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Название сайта для отображения в попапе
                                    </small>
                                </div>
                            </>
                        )}
                        {showAdvancedFields && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="search-path" className="text-sm font-medium text-[var(--text)]">Путь для поиска (необязательно):</label>
                                    <input
                                        id="search-path"
                                        type="text"
                                        value={searchPath}
                                        onChange={(e) => setSearchPath(e.target.value)}
                                        placeholder="/search или /results"
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Путь на сайте для поиска (например, /search, /results)
                                    </small>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="search-param" className="text-sm font-medium text-[var(--text)]">Параметр поиска (например, q, search_query, k):</label>
                                    <input
                                        id="search-param"
                                        type="text"
                                        value={searchParam}
                                        onChange={(e) => setSearchParam(e.target.value)}
                                        placeholder="q"
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Параметр запроса для поиска (например, q для Google, search_query для YouTube)
                                    </small>
                                </div>
                            </>
                        )}
                        {error && <div className="p-3 bg-[#fee] border border-[var(--google-red)] rounded text-[var(--google-red)] text-sm">{error}</div>}
                        <button 
                            type="submit" 
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--google-blue)] text-white border-none rounded text-sm font-medium cursor-pointer transition-colors hover:bg-[#3367d6] self-start disabled:opacity-60 disabled:cursor-not-allowed" 
                            disabled={isAdding}
                        >
                            {isAdding && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {isAdding ? "Сохранение..." : "Добавить"}
                        </button>
                    </form>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-xl font-normal m-0 mb-5 text-[var(--text)]">Сохраненные сайты</h2>
                    {keywords.length === 0 ? (
                        <p className="text-center text-[var(--text-secondary)] py-10 px-5 text-base">Нет сохраненных сайтов</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {keywords.map((item) => (
                                <div key={item.keyword} className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg)] flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                        <img
                                            src={getFaviconUrl(item.url)}
                                            alt={item.keyword}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = "none";
                                                const letter = target.nextElementSibling as HTMLElement;
                                                if (letter) letter.style.display = "block";
                                            }}
                                        />
                                        <span className="text-lg font-medium text-[var(--text)] hidden">
                                            {item.keyword.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-1">
                                        <div className="text-base font-medium text-[var(--text)]">{item.keyword}</div>
                                        <div className="text-sm text-[var(--text-secondary)] break-all">{item.url}</div>
                                        {item.description && (
                                            <div className="text-sm text-[var(--text-secondary)]">{item.description}</div>
                                        )}
                                    </div>
                                    <button
                                        className="bg-transparent border-none text-xl cursor-pointer p-2 rounded transition-colors hover:bg-[var(--border)] flex-shrink-0"
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

                {isAuthenticated && (
                    <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                        <h2 className="text-xl font-normal m-0 mb-5 text-[var(--text)]">Аккаунт</h2>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 bg-transparent text-[var(--text)] border border-[var(--border)] rounded text-sm font-medium cursor-pointer transition-all hover:bg-[var(--hover)] hover:border-[var(--google-red)] text-[var(--google-red)]"
                        >
                            Выйти из аккаунта
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}


