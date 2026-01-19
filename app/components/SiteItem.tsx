"use client";

import { useState } from "react";
import { getFaviconUrl } from "../lib/utils";
import type { KeywordMapping } from "../types";

interface SiteItemProps {
    site: KeywordMapping;
    onClick?: (url: string) => void;
}

export default function SiteItem({ site, onClick }: SiteItemProps) {
    const [imageError, setImageError] = useState(false);
    const faviconUrl = getFaviconUrl(site.url);

    const handleClick = () => {
        const url = site.url;
        if (onClick) {
            onClick(url);
        } else {
            window.location.href = url;
        }
    };

    return (
        <div className="flex flex-col items-center cursor-pointer p-2 rounded-lg transition-all hover:bg-[var(--hover)] active:scale-[0.98]" onClick={handleClick}>
            <div className="w-16 h-16 rounded-full bg-[var(--hover)] flex items-center justify-center mb-3 overflow-hidden relative">
                {!imageError && faviconUrl ? (
                    <img
                        src={faviconUrl}
                        alt={site.keyword}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="text-[32px] font-medium text-[var(--text)] block">
                        {site.keyword.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <span className="text-sm text-center text-[var(--text)] break-words max-w-[100px] truncate">
                {site.description || site.keyword}
            </span>
        </div>
    );
}

