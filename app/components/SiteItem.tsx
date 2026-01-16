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
        <div className="site-item" onClick={handleClick}>
            <div className="site-icon">
                {!imageError && faviconUrl ? (
                    <img
                        src={faviconUrl}
                        alt={site.keyword}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="icon-letter">
                        {site.keyword.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <span className="site-label">
                {site.description || site.keyword}
            </span>
        </div>
    );
}

