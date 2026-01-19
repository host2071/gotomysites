"use client";

import { useEffect } from "react";
import Image from "next/image";
import SearchBar from "./components/SearchBar";
import SitesGrid from "./components/SitesGrid";
import Header from "./components/Header";
import { getCurrentUser } from "./lib/firebase/auth";
import { initializeSync } from "./lib/storage/sync";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

export default function Home() {
    useEffect(() => {
        // Инициализируем синхронизацию при загрузке
        getCurrentUser().then((user) => {
            if (user) {
                initializeSync();
            }
        });
    }, []);
    
    const handleSearch = (url: string) => {
        window.location.href = url;
    };

    const handleSiteClick = (url: string) => {
        window.location.href = url;
    };

    return (
        <div className="min-h-screen flex flex-col pt-20">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 max-w-[1200px] mx-auto w-full">
                <div className="w-full max-w-[584px] mb-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <Image 
                            src="/images/icon-128.png" 
                            alt={APP_NAME} 
                            width={128} 
                            height={128}
                            className="w-16 h-16 md:w-28 md:h-28 flex-shrink-0"
                            priority
                        />
                        <h1 className="text-6xl font-normal tracking-tight m-0 leading-tight">my Sites</h1>
                    </div>
                </div>
                
                <div className="w-full max-w-[584px] mb-10">
                    <SearchBar onSearch={handleSearch} />
                </div>
                
                <div className="w-full max-w-[800px]">
                    <SitesGrid onSiteClick={handleSiteClick} />
                </div>
            </main>
        </div>
    );
}


