"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { login, register, loginWithGoogle, getCurrentUser, logout, onAuthChange } from "../lib/firebase/auth";
import { initializeSync } from "../lib/storage/sync";
import { resetLocalStorage } from "../lib/storage/local";

export default function Auth() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Subscribe to auth changes and redirect after successful login
        const unsubscribe = onAuthChange(async (authUser) => {
            setUser(authUser);
            setLoading(false);
            
            if (authUser) {
                // Initialize sync after login
                initializeSync();
                // Redirect to the home page
                router.replace("/");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            // After successful auth, onAuthChange will update state and redirect
        } catch (error: any) {
            setError(error.message || "Authentication error");
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            // After successful auth, onAuthChange will update state and redirect
        } catch (error: any) {
            setError(error.message || "Google sign-in error");
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            // Reset localStorage to default settings
            resetLocalStorage();
            setUser(null);
        } catch (error: any) {
            setError(error.message || "Ошибка выхода");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px] text-[var(--text-secondary)]">
                <p>Loading...</p>
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-sm text-[var(--text)]">{user.email}</span>
                </div>
                <button onClick={handleLogout} className="px-4 py-2 bg-[var(--hover)] text-[var(--text)] border border-[var(--border)] rounded transition-all hover:bg-[var(--border)] text-sm cursor-pointer">
                    Log out
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-5 bg-[var(--bg)]">
            <div className="w-full max-w-[400px] bg-[var(--bg)] border border-[var(--border)] rounded-lg p-8 shadow-[0_2px_8px_var(--shadow)]">
                <h2 className="text-2xl font-normal m-0 mb-6 text-center text-[var(--text)]">{isLogin ? "Sign in" : "Sign up"}</h2>
                
                {error && (
                    <div className="bg-[#fee] border border-[var(--google-red)] text-[var(--google-red)] p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)] disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex flex-col">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Пароль"
                            required
                            className="px-4 py-3 border border-[var(--border)] rounded text-sm bg-[var(--bg)] text-[var(--text)] font-inherit transition-colors focus:outline-none focus:border-[var(--google-blue)] disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                            minLength={6}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="px-6 py-3 bg-[var(--google-blue)] text-white border-none rounded text-sm font-medium cursor-pointer transition-colors hover:bg-[#3367d6] disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Loading..." : (isLogin ? "Sign in" : "Sign up")}
                    </button>
                </form>

                <div className="flex items-center my-6 text-center">
                    <div className="flex-1 border-b border-[var(--border)]"></div>
                    <span className="px-4 text-[var(--text-secondary)] text-sm">or</span>
                    <div className="flex-1 border-b border-[var(--border)]"></div>
                </div>

                <button 
                    type="button" 
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] rounded text-sm font-medium cursor-pointer transition-all hover:bg-[var(--hover)] hover:border-[var(--google-blue)] disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                </button>

                <button 
                    type="button" 
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError("");
                    }}
                    className="w-full mt-4 p-2 bg-transparent border-none text-[var(--google-blue)] text-sm cursor-pointer underline transition-opacity hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
            </div>
        </div>
    );
}

