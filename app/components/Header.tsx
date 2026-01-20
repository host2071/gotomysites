"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthChange } from "../lib/firebase/auth";

const EXTENSION_URL = process.env.NEXT_PUBLIC_URL_EXTENSION || "https://chrome.google.com/webstore";

export default function Header() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        // Subscribe to auth changes so header updates immediately
        const unsubscribe = onAuthChange((user) => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    return (
        <header className="fixed top-0 left-0 right-0 flex items-center justify-end gap-4 px-6 py-3 bg-[var(--bg)] border-b border-[var(--border)] z-[1000] shadow-[0_1px_2px_var(--shadow)]">
            {!isLoading && (
                <>
                    {isAuthenticated ? (
                        <Link href="/settings" className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent border-none cursor-pointer text-[var(--text)] no-underline transition-colors hover:bg-[var(--hover)]" title="Settings">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                        </Link>
                    ) : (
                        <Link href="/auth" className="flex items-center gap-2 px-4 py-2 bg-[var(--google-blue)] text-white no-underline rounded-full text-sm font-medium transition-colors hover:bg-[#3367d6]" title="Sign in">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>Sign in</span>
                        </Link>
                    )}
                </>
            )}
            <Link href="/help" className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent border-none cursor-pointer text-[var(--text)] no-underline transition-colors hover:bg-[var(--hover)]" title="Help">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                </svg>
            </Link>
            {EXTENSION_URL && (
                <a 
                    href={EXTENSION_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--google-blue)] text-white no-underline rounded-full text-sm font-medium transition-colors hover:bg-[#3367d6]"
                    title="Установить расширение"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <span>Install extension</span>
                </a>
            )}
        </header>
    );
}

