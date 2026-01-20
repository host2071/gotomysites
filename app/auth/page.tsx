"use client";

import Auth from "../components/Auth";
import Link from "next/link";

export default function AuthPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] p-5">
            <Link href="/" className="inline-block mb-5 text-[var(--google-blue)] no-underline text-sm transition-opacity hover:opacity-80">
                ← Back to home
            </Link>
            <Auth />
        </div>
    );
}


