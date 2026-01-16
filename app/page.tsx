"use client";

import { useEffect } from "react";
import SearchBar from "./components/SearchBar";
import SitesGrid from "./components/SitesGrid";
import Header from "./components/Header";
import { getCurrentUser } from "./lib/firebase/auth";
import { initializeSync } from "./lib/storage/sync";

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
        <div className="home-container">
            <Header />
            <main className="main-content">
                <div className="hero-section">
                    <h1 className="hero-title">Ready when you are.</h1>
                </div>
                
                <div className="search-section">
                    <SearchBar onSearch={handleSearch} />
                </div>
                
                <div className="sites-section">
                    <SitesGrid onSiteClick={handleSiteClick} />
                </div>
            </main>
        </div>
    );
}


