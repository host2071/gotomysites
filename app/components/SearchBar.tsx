"use client";

import { useState, FormEvent, KeyboardEvent, useEffect, useRef, useCallback, useMemo } from "react";
import { parseQuery, processSearchQuery } from "../lib/utils";
import { getKeywordsSync } from "../lib/storage/index";
import { loadData } from "../lib/storage/index";
import { getCurrentUser } from "../lib/firebase/auth";
import { getPopularUserSites } from "../lib/firebase/sites";
import type { KeywordMapping } from "../types";
import SuggestionsList from "./SuggestionsList";
import { useKeywordsData } from "../hooks/useKeywordsData";

interface SearchBarProps {
    onSearch?: (url: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const { keywords, data, isLoading } = useKeywordsData();

    // Load popular sites when focusing on empty input
    const loadPopularSuggestions = useCallback(async () => {
        if (query.trim() || isLoading) return;

        try {
            const user = await getCurrentUser();
            
            if (user && keywords.length > 0) {
                const availableKeywords = keywords.map(k => k.keyword);
                const popularSites = await getPopularUserSites(availableKeywords, 10);
                if (popularSites.length > 0) {
                    setSuggestions(popularSites.map(site => site.keyword));
                    setShowSuggestions(true);
                    return;
                }
            }

            // Fallback to local keywords
            const localKeywords = keywords.length > 0 ? keywords : getKeywordsSync();
            if (localKeywords.length > 0) {
                setSuggestions(localKeywords.map(k => k.keyword));
                setShowSuggestions(true);
            }
        } catch (err) {
            console.error("Error loading popular suggestions:", err);
            const localKeywords = getKeywordsSync();
            if (localKeywords.length > 0) {
                setSuggestions(localKeywords.map(k => k.keyword));
                setShowSuggestions(true);
            }
        }
    }, [query, keywords, isLoading]);

    // Filter suggestions as user types
    const filteredSuggestions = useMemo(() => {
        if (!query.trim()) return [];
        
        const { keyword } = parseQuery(query);
        const keywordLower = keyword.toLowerCase();
        
        const keywordsList = keywords.length > 0 ? keywords : getKeywordsSync();
        
        return keywordsList
            .filter((k: KeywordMapping) => {
                const kLower = k.keyword.toLowerCase();
                return kLower.startsWith(keywordLower) || 
                       k.description?.toLowerCase().includes(keywordLower);
            })
            .slice(0, 5)
            .map((k: KeywordMapping) => k.keyword);
    }, [query, keywords]);

    // Update suggestions when filtering changes
    useEffect(() => {
        if (query.trim()) {
            setSuggestions(filteredSuggestions);
            setShowSuggestions(filteredSuggestions.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [filteredSuggestions, query]);

    // Close suggestions when clicking outside the element
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                showSuggestions
            ) {
                setShowSuggestions(false);
                setSelectedIndex(-1);
                setIsNavigatingWithKeyboard(false);
            }
        };

        if (showSuggestions) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSuggestions]);

    const handleInputChange = useCallback((value: string) => {
        setQuery(value);
        setSelectedIndex(-1);
        setIsNavigatingWithKeyboard(false);
    }, []);

    const handleSuggestionSelect = useCallback((suggestion: string) => {
        setQuery(suggestion + " ");
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setIsNavigatingWithKeyboard(false);
        setTimeout(() => {
            inputRef.current?.focus();
            if (inputRef.current) {
                const length = inputRef.current.value.length;
                inputRef.current.setSelectionRange(length, length);
            }
        }, 0);
    }, []);

    const performSearch = useCallback(async () => {
        if (!query.trim()) return;

        let currentData = data;
        if (!currentData) {
            try {
                currentData = await loadData();
            } catch (err) {
                console.error("Error loading data:", err);
                return;
            }
        }

        const targetUrl = await processSearchQuery(query, currentData);
        if (!targetUrl) return;
        
        if (onSearch) {
            onSearch(targetUrl);
        } else {
            window.location.href = targetUrl;
        }
        
        setShowSuggestions(false);
        setSelectedIndex(-1);
    }, [query, data, onSearch]);

    const handleSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex]);
        } else {
            performSearch();
        }
    }, [selectedIndex, suggestions, handleSuggestionSelect, performSearch]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === "Escape") {
                setShowSuggestions(false);
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setIsNavigatingWithKeyboard(true);
                setSelectedIndex((prev) => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setIsNavigatingWithKeyboard(true);
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSuggestionSelect(suggestions[selectedIndex]);
                } else {
                    performSearch();
                }
                break;
            case "Escape":
                e.preventDefault();
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
        }
    }, [showSuggestions, suggestions, selectedIndex, handleSuggestionSelect, performSearch]);

    const handleSuggestionMouseEnter = useCallback((index: number) => {
        if (!isNavigatingWithKeyboard) {
            setSelectedIndex(index);
        }
    }, [isNavigatingWithKeyboard]);

    const handleSuggestionMouseLeave = useCallback(() => {
        if (!isNavigatingWithKeyboard) {
            setSelectedIndex(-1);
        }
    }, [isNavigatingWithKeyboard]);

    const handleFocus = useCallback(() => {
        if (query.trim()) {
            if (suggestions.length > 0) {
                setShowSuggestions(true);
            }
        } else {
            loadPopularSuggestions();
        }
    }, [query, suggestions.length, loadPopularSuggestions]);

    const handleClear = useCallback(() => {
        setQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
            <form onSubmit={handleSubmit} className="block w-full">
                <div className="relative flex items-center border border-[var(--border)] rounded-3xl px-4 h-[48px] bg-[var(--bg)] transition-shadow hover:shadow-[0_2px_5px_1px_var(--shadow)] focus-within:shadow-[0_2px_5px_1px_var(--shadow)] focus-within:border-transparent box-border">
                    <svg 
                        className="w-5 h-5 mr-3 text-[var(--text-secondary)] flex-shrink-0" 
                        focusable="false" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        placeholder="Ask anything"
                        className="flex-1 border-none outline-none bg-transparent text-[var(--text)] text-base font-inherit placeholder:text-[var(--text-secondary)] h-full min-h-0"
                        autoComplete="off"
                        style={{ lineHeight: '1.5' }}
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-transparent border-none cursor-pointer p-1 ml-2 flex items-center justify-center text-[var(--text-secondary)] rounded-full transition-colors hover:bg-[var(--hover)]"
                            aria-label="Clear"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                            </svg>
                        </button>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                        <SuggestionsList
                            suggestions={suggestions}
                            selectedIndex={selectedIndex}
                            isNavigatingWithKeyboard={isNavigatingWithKeyboard}
                            onSelect={handleSuggestionSelect}
                            onMouseEnter={handleSuggestionMouseEnter}
                            onMouseLeave={handleSuggestionMouseLeave}
                        />
                    )}
                </div>
            </form>
        </div>
    );
}
