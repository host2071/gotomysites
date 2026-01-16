"use client";

import Auth from "../components/Auth";
import Link from "next/link";

export default function AuthPage() {
    return (
        <div className="auth-page-container">
            <Link href="/" className="auth-back-link">
                ← Назад на главную
            </Link>
            <Auth />
        </div>
    );
}


