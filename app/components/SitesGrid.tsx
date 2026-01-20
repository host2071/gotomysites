"use client";

import { useEffect, useState } from "react";
import { getKeywords, subscribeToDataChanges, getKeywordsSync } from "../lib/storage/index";
import type { KeywordMapping } from "../types";
import SiteItem from "./SiteItem";

interface SitesGridProps {
    onSiteClick?: (url: string) => void;
}

export default function SitesGrid({ onSiteClick }: SitesGridProps) {
    const [sites, setSites] = useState<KeywordMapping[]>([]);

    useEffect(() => {
        // First load sites from localStorage for fast loading
        const keywords = getKeywordsSync();
        setSites(keywords);

        // Then sync with Firebase in background (non-blocking)
        const loadSitesAsync = async () => {
            try {
                const keywordsAsync = await getKeywords();
                // Update only if data has changed
                if (keywordsAsync.length !== keywords.length) {
                    setSites(keywordsAsync);
                }
            } catch (err) {
                console.error("Error loading sites:", err);
            }
        };

        loadSitesAsync();

        // Subscribe to changes
        const unsubscribe = subscribeToDataChanges((data) => {
            if (data) {
                setSites(data.keywords || []);
            }
        });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    if (sites.length === 0) {
        return (
            <div className="text-center py-10 px-5 text-[var(--text-secondary)]">
                <p>No saved sites</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-6 py-5">
            {sites.map((site) => (
                <SiteItem
                    key={site.keyword}
                    site={site}
                    onClick={onSiteClick}
                />
            ))}
        </div>
    );
}

