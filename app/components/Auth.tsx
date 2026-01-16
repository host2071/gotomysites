"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { login, register, loginWithGoogle, getCurrentUser, logout, onAuthChange } from "../lib/firebase/auth";
import { initializeSync } from "../lib/storage/sync";

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
        // Подписываемся на изменения авторизации
        const unsubscribe = onAuthChange(async (authUser) => {
            setUser(authUser);
            setLoading(false);
            
            if (authUser) {
                // Инициализируем синхронизацию
                initializeSync();
                // Перенаправляем на главную страницу
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
            // После успешной авторизации onAuthChange автоматически обновит состояние и выполнит редирект
        } catch (error: any) {
            setError(error.message || "Ошибка авторизации");
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            // После успешной авторизации onAuthChange автоматически обновит состояние и выполнит редирект
        } catch (error: any) {
            setError(error.message || "Ошибка авторизации через Google");
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
        } catch (error: any) {
            setError(error.message || "Ошибка выхода");
        }
    };

    if (loading) {
        return (
            <div className="auth-loading">
                <p>Загрузка...</p>
            </div>
        );
    }

    if (user) {
        return (
            <div className="auth-user">
                <div className="auth-user-info">
                    <span className="auth-user-email">{user.email}</span>
                </div>
                <button onClick={handleLogout} className="auth-logout-button">
                    Выйти
                </button>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-form-wrapper">
                <h2 className="auth-title">{isLogin ? "Вход" : "Регистрация"}</h2>
                
                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-form-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="auth-input"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="auth-form-group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Пароль"
                            required
                            className="auth-input"
                            disabled={isSubmitting}
                            minLength={6}
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="auth-submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Загрузка..." : (isLogin ? "Войти" : "Зарегистрироваться")}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>или</span>
                </div>

                <button 
                    type="button" 
                    onClick={handleGoogleLogin}
                    className="auth-google-button"
                    disabled={isSubmitting}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Войти через Google
                </button>

                <button 
                    type="button" 
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError("");
                    }}
                    className="auth-toggle-button"
                    disabled={isSubmitting}
                >
                    {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
                </button>
            </div>
        </div>
    );
}

