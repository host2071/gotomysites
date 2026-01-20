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
        
        // Check current auth status
        getCurrentUser().then((user) => {
            setIsAuthenticated(!!user);
        });
        
        // Subscribe to data changes (Firebase or local storage)
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
        // Fallback: first param with a non-empty value
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
            setError("Enter a URL to parse");
            return;
        }

        if (!isValidUrl(rawUrl)) {
            setError("Invalid URL format");
            return;
        }

        const normalized = normalizeUrl(rawUrl);
        try {
            const urlObj = new URL(normalized);
            // Detect base URL, path and search param
            const origin = urlObj.origin;
            const path = urlObj.pathname && urlObj.pathname !== "/" ? urlObj.pathname : "";
            const param = guessSearchParamFromUrl(urlObj) || "";
            const hostname = urlObj.hostname;
            const suggestedKeyword = hostname.replace(/^www\./, "").split(".")[0].toLowerCase();
            const suggestedDescription = labelFromDomain(hostname);

            // Check if there is a predefined site with this keyword in Firebase
            try {
                const existingSite = await getSiteByKeyword(suggestedKeyword);
                if (existingSite) {
                    // Use data from the database
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
                // If Firebase is not initialized or fails, just continue with parsed data
                console.warn("Firebase error:", firebaseError);
            }
            
            // If there is no site in the database, use parsed data
            setSearchPath(path);
            setSearchParam(param);
            setKeyword(suggestedKeyword);
            setDescription(suggestedDescription);
            setUrl(origin); // только домен
            setShowAdvancedFields(true);
            setError("");
        } catch {
            setError("Error while parsing URL");
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (!keyword.trim()) {
            setError("Enter a keyword");
            return;
        }

        if (!url.trim()) {
            setError("Enter a URL");
            return;
        }

        if (!isValidUrl(url)) {
            setError("Invalid URL");
            return;
        }

        const normalizedUrl = normalizeUrl(url);
        let originOnly = normalizedUrl;
        try {
            const parsed = new URL(normalizedUrl);
            originOnly = parsed.origin;
        } catch {
            // Fallback to the original normalized URL
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
            
            // Verify that data was actually added
            // For authenticated users we check Firebase, for guests we rely on localStorage
            const user = await getCurrentUser();
            if (user) {
                // For authenticated users: wait until data appears in Firebase
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
                    throw new Error("Data was not saved on the server");
                }
            }
            // For guests: data is already in localStorage, no extra check required
            
            // Reset form
            setKeyword("");
            setUrl("");
            setDescription("");
            setSearchPath("");
            setSearchParam("");
            setShowAdvancedFields(false);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error while adding website");
            console.error("Error adding keyword:", err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (keywordToDelete: string) => {
        if (confirm(`Delete keyword "${keywordToDelete}"?`)) {
            try {
                await removeKeyword(keywordToDelete);
                // Data will be refreshed automatically by subscription
            } catch (err) {
                setError("Error while deleting website");
                console.error("Error removing keyword:", err);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            // Reset localStorage to default settings
            resetLocalStorage();
            router.push("/");
        } catch (err) {
            setError("Error while logging out");
            console.error("Error logging out:", err);
        }
    };

    return (
        <div className="min-h-screen px-5 py-20 max-w-[800px] mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/" className="text-[var(--google-blue)] no-underline text-sm transition-opacity hover:opacity-80">
                    ← Back
                </Link>
                <h1 className="text-[32px] font-normal m-0 text-[var(--text)]">Settings</h1>
            </header>

            <div className="flex flex-col gap-8">
                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-xl font-normal m-0 mb-5 text-[var(--text)]">Add website</h2>
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
                                        // Hide advanced fields when URL changes
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
                                    title="Parse URL and fill the fields automatically"
                                >
                                    Parse
                                </button>
                            </div>
                            <small className="text-xs text-[var(--text-secondary)] mt-1">
                                💡 Tip: click Parse to auto-fill fields from the URL
                            </small>
                        </div>
                        {showAdvancedFields && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="keyword" className="text-sm font-medium text-[var(--text)]">Keyword:</label>
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
                                        Word you type in the search bar (for example, youtube)
                                    </small>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="description" className="text-sm font-medium text-[var(--text)]">Description (optional):</label>
                                    <input
                                        id="description"
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="YouTube"
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Website name shown in the UI
                                    </small>
                                </div>
                            </>
                        )}
                        {showAdvancedFields && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="search-path" className="text-sm font-medium text-[var(--text)]">Search path (optional):</label>
                                    <input
                                        id="search-path"
                                        type="text"
                                        value={searchPath}
                                        onChange={(e) => setSearchPath(e.target.value)}
                                        placeholder="/search or /results"
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Path on the website used for search (for example, /search, /results)
                                    </small>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="search-param" className="text-sm font-medium text-[var(--text)]">Search parameter (for example, q, search_query, k):</label>
                                    <input
                                        id="search-param"
                                        type="text"
                                        value={searchParam}
                                        onChange={(e) => setSearchParam(e.target.value)}
                                        placeholder="q"
                                        className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)]"
                                    />
                                    <small className="text-xs text-[var(--text-secondary)] mt-1">
                                        Query parameter used for search (for example, q for Google, search_query for YouTube)
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
                            {isAdding ? "Saving..." : "Add website"}
                        </button>
                    </form>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-xl font-normal m-0 mb-5 text-[var(--text)]">Saved websites</h2>
                    {keywords.length === 0 ? (
                        <p className="text-center text-[var(--text-secondary)] py-10 px-5 text-base">No saved websites yet</p>
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
                                        title="Delete"
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
                        <h2 className="text-xl font-normal m-0 mb-5 text-[var(--text)]">Account</h2>
                        <button
                            onClick={handleLogout}
                            className="px-6 py-3 bg-transparent text-[var(--text)] border border-[var(--border)] rounded text-sm font-medium cursor-pointer transition-all hover:bg-[var(--hover)] hover:border-[var(--google-red)] text-[var(--google-red)]"
                        >
                            Log out
                        </button>
                    </section>
                )}
            </div>
        </div>
    );
}


