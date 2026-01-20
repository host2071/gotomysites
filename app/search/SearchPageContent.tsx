"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { processSearchQuery } from "../lib/utils";

export default function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    useEffect(() => {
        if (!query.trim()) {
            // If no query, redirect to home
            window.location.href = "/";
            return;
        }

        const performSearch = async () => {
            // Use universal search processing function
            const targetUrl = await processSearchQuery(query);
            
            if (targetUrl) {
                window.location.href = targetUrl;
            } else {
                // If query is empty, redirect to home
                window.location.href = "/";
            }
        };

        performSearch();
    }, [query]);

    // Show loading during search
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-5">
            <div className="text-lg font-normal">Searching...</div>
            <div className="text-sm text-[var(--text-secondary)] opacity-70">{query}</div>
        </div>
    );
}

