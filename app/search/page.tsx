"use client";

import { Suspense } from "react";
import SearchPageContent from "./SearchPageContent";

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="search-page-container" style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                gap: "1rem"
            }}>
                <div style={{ fontSize: "1.2rem" }}>Загрузка...</div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

