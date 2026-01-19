"use client";

import { useEffect, useRef } from "react";

interface SuggestionsListProps {
    suggestions: string[];
    selectedIndex: number;
    isNavigatingWithKeyboard: boolean;
    onSelect: (suggestion: string) => void;
    onMouseEnter: (index: number) => void;
    onMouseLeave: () => void;
    className?: string;
}

export default function SuggestionsList({
    suggestions,
    selectedIndex,
    isNavigatingWithKeyboard,
    onSelect,
    onMouseEnter,
    onMouseLeave,
    className = ""
}: SuggestionsListProps) {
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Прокрутка к выбранной подсказке
    useEffect(() => {
        if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
            suggestionRefs.current[selectedIndex]?.scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }
    }, [selectedIndex, suggestions]);

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Предотвращаем blur при клике на контейнер подсказок
    };

    if (suggestions.length === 0) return null;

    return (
        <div 
            ref={suggestionsRef}
            className={`absolute top-full left-0 right-0 mt-2 bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-[100] max-h-[300px] overflow-y-auto pointer-events-auto ${className}`}
            onMouseDown={handleContainerMouseDown}
        >
            {suggestions.map((suggestion, index) => (
                <div
                    key={`${suggestion}-${index}`}
                    ref={(el) => {
                        suggestionRefs.current[index] = el;
                    }}
                    className={`flex items-center px-4 py-3 cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        selectedIndex === index 
                            ? "bg-[var(--hover)]" 
                            : "hover:bg-[var(--hover)]"
                    }`}
                    onMouseEnter={() => onMouseEnter(index)}
                    onMouseLeave={onMouseLeave}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onSelect(suggestion);
                    }}
                >
                    <span>{suggestion}</span>
                </div>
            ))}
        </div>
    );
}

