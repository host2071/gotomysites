"use client";

import { useState, FormEvent, KeyboardEvent, useEffect } from "react";
import { parseQuery, processSearchQuery } from "../lib/utils";
import { getKeywords, getKeywordsSync } from "../lib/storage/index";
import { loadData as loadLocalDataSync } from "../lib/storage/local";
import { loadData } from "../lib/storage/index";
import type { KeywordMapping } from "../types";

interface SearchBarProps {
    onSearch?: (url: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [keywords, setKeywords] = useState<KeywordMapping[]>([]);
    const [data, setData] = useState<{ keywords: KeywordMapping[]; settings?: any } | null>(null);

    useEffect(() => {
        // Сначала загружаем данные из localStorage для быстрой загрузки
        try {
            const localData = loadLocalDataSync();
            setData(localData);
            setKeywords(localData.keywords);
        } catch (err) {
            console.error("Error loading local data:", err);
        }

        // Затем синхронизируем с Firebase в фоне (не блокируем загрузку)
        const loadDataAsync = async () => {
            try {
                const loadedData = await loadData();
                // Обновляем только если данные изменились
                setData(loadedData);
                setKeywords(loadedData.keywords);
            } catch (err) {
                console.error("Error loading data:", err);
            }
        };
        loadDataAsync();
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);
        
        if (value.trim()) {
            const { keyword } = parseQuery(value);
            
            // Используем загруженные данные или загружаем синхронно для неавторизованных
            let keywordsList = keywords;
            if (keywordsList.length === 0) {
                // Пытаемся загрузить синхронно (для неавторизованных пользователей)
                keywordsList = getKeywordsSync();
                if (keywordsList.length > 0) {
                    setKeywords(keywordsList);
                }
            }
            
            // Поиск подходящих ключевых слов
            const matches = keywordsList
                .filter((k: KeywordMapping) => 
                    k.keyword.toLowerCase().startsWith(keyword.toLowerCase()) ||
                    k.description?.toLowerCase().includes(keyword.toLowerCase())
                )
                .slice(0, 5)
                .map((k: KeywordMapping) => k.keyword);
            
            setSuggestions(matches);
            setShowSuggestions(matches.length > 0 && keyword.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        performSearch();
    };

    const performSearch = async () => {
        if (!query.trim()) return;

        // Используем загруженные данные или загружаем заново
        let currentData = data;
        if (!currentData) {
            try {
                currentData = await loadData();
                setData(currentData);
                setKeywords(currentData.keywords);
            } catch (err) {
                console.error("Error loading data:", err);
                return;
            }
        }

        // Используем универсальную функцию обработки поиска
        const targetUrl = await processSearchQuery(query, currentData);
        
        if (!targetUrl) {
            return;
        }
        
        if (onSearch) {
            onSearch(targetUrl);
        } else {
            window.location.href = targetUrl;
        }
        
        // Не очищаем поле ввода, только скрываем подсказки
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-wrapper">
                    <svg 
                        className="search-icon" 
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
                        type="text"
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) {
                                setShowSuggestions(true);
                            }
                        }}
                        onBlur={() => {
                            // Задержка для обработки клика по подсказке
                            setTimeout(() => setShowSuggestions(false), 200);
                        }}
                        placeholder="Ask anything"
                        className="search-input"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                            className="clear-button"
                            aria-label="Очистить"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                            </svg>
                        </button>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestions-dropdown">
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    <span>{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

