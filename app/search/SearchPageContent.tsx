"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { processSearchQuery } from "../lib/utils";

export default function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    useEffect(() => {
        if (!query.trim()) {
            // Если нет запроса, перенаправляем на главную
            window.location.href = "/";
            return;
        }

        const performSearch = async () => {
            // Используем универсальную функцию обработки поиска
            const targetUrl = await processSearchQuery(query);
            
            if (targetUrl) {
                window.location.href = targetUrl;
            } else {
                // Если запрос пустой, перенаправляем на главную
                window.location.href = "/";
            }
        };

        performSearch();
    }, [query]);

    // Показываем загрузку во время поиска
    return (
        <div className="search-page-container">
            <div className="search-loading-text">Поиск...</div>
            <div className="search-query-text">{query}</div>
        </div>
    );
}

