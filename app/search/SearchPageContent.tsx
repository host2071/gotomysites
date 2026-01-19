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
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-5">
            <div className="text-lg font-normal">Поиск...</div>
            <div className="text-sm text-[var(--text-secondary)] opacity-70">{query}</div>
        </div>
    );
}

