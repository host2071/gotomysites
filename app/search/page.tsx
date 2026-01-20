"use client";

import { Suspense } from "react";
import SearchPageContent from "./SearchPageContent";

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-xl">Loading...</div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

