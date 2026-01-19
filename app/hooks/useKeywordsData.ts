import { useState, useEffect } from "react";
import { loadData as loadLocalDataSync } from "../lib/storage/local";
import { loadData } from "../lib/storage/index";
import type { KeywordMapping } from "../types";

export function useKeywordsData() {
    const [keywords, setKeywords] = useState<KeywordMapping[]>([]);
    const [data, setData] = useState<{ keywords: KeywordMapping[]; settings?: any } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Сначала загружаем данные из localStorage для быстрой загрузки
        try {
            const localData = loadLocalDataSync();
            setData(localData);
            setKeywords(localData.keywords);
            setIsLoading(false);
        } catch (err) {
            console.error("Error loading local data:", err);
            setIsLoading(false);
        }

        // Затем синхронизируем с Firebase в фоне
        const loadDataAsync = async () => {
            try {
                const loadedData = await loadData();
                setData(loadedData);
                setKeywords(loadedData.keywords);
            } catch (err) {
                console.error("Error loading data:", err);
            }
        };
        loadDataAsync();
    }, []);

    return { keywords, data, isLoading };
}

