"use client";

import Link from "next/link";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME;

export default function HelpPage() {
    return (
        <div className="min-h-screen px-5 py-20 max-w-[900px] mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/" className="text-[var(--google-blue)] no-underline text-sm transition-opacity hover:opacity-80">
                    ← Назад
                </Link>
                <h1 className="text-[32px] font-normal m-0 text-[var(--text)]">Справка</h1>
            </header>

            <div className="flex flex-col gap-8">
                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Что такое {APP_NAME}?</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0 mb-4">
                        {APP_NAME} — это веб-приложение для быстрого доступа к вашим любимым сайтам. 
                        Просто введите ключевое слово в поисковую строку, и вы мгновенно перейдете на нужный сайт.
                    </p>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Основные функции</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mt-5">
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">🔍 Быстрый поиск</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                Введите ключевое слово сайта в поисковую строку (например, "youtube") и нажмите Enter. 
                                Вы будете перенаправлены на соответствующий сайт.
                            </p>
                        </div>
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">🔎 Поиск по сайтам</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                Вы можете искать прямо на сайте! Введите ключевое слово и поисковый запрос 
                                (например, "youtube react tutorial"), и вы перейдете на сайт с результатами поиска.
                            </p>
                        </div>
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">📱 Быстрый доступ к сайтам</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                На главной странице отображается сетка с популярными сайтами. 
                                Просто кликните на иконку сайта, чтобы перейти на него.
                            </p>
                        </div>
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">⚙️ Управление сайтами</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                В настройках вы можете добавлять новые сайты, удалять существующие и настраивать 
                                ключевые слова для быстрого доступа.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Как использовать</h2>
                    <div className="flex flex-col gap-5 mt-5">
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">1</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Переход на сайт</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    Введите ключевое слово в поисковую строку и нажмите Enter. 
                                    Например: <code className="bg-[var(--hover)] px-2 py-1 rounded text-sm text-[var(--text)] border border-[var(--border)]">youtube</code> → откроется YouTube
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">2</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Поиск на сайте</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    Введите ключевое слово и поисковый запрос через пробел. 
                                    Например: <code className="bg-[var(--hover)] px-2 py-1 rounded text-sm text-[var(--text)] border border-[var(--border)]">youtube react hooks</code> → откроется YouTube с поиском "react hooks"
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">3</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Клик по иконке</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    На главной странице кликните на иконку сайта в сетке, 
                                    чтобы быстро перейти на него без ввода текста.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">4</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Добавление сайтов</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    Перейдите в настройки (иконка шестеренки в правом верхнем углу), 
                                    заполните форму и добавьте новый сайт с ключевым словом.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Примеры использования</h2>
                    <div className="flex flex-col gap-4 mt-5">
                        <div className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <code className="bg-[var(--bg)] px-3 py-2 rounded text-sm text-[var(--text)] inline-block border border-[var(--border)]">google</code>
                            </div>
                            <div className="text-xl text-[var(--text-secondary)] font-semibold">→</div>
                            <div className="flex-1 min-w-[200px] text-[var(--text-secondary)] text-sm">
                                Откроется Google
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <code className="bg-[var(--bg)] px-3 py-2 rounded text-sm text-[var(--text)] inline-block border border-[var(--border)]">youtube react tutorial</code>
                            </div>
                            <div className="text-xl text-[var(--text-secondary)] font-semibold">→</div>
                            <div className="flex-1 min-w-[200px] text-[var(--text-secondary)] text-sm">
                                Откроется YouTube с поиском "react tutorial"
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <code className="bg-[var(--bg)] px-3 py-2 rounded text-sm text-[var(--text)] inline-block border border-[var(--border)]">github typescript</code>
                            </div>
                            <div className="text-xl text-[var(--text-secondary)] font-semibold">→</div>
                            <div className="flex-1 min-w-[200px] text-[var(--text-secondary)] text-sm">
                                Откроется GitHub с поиском "typescript"
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Настройки</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0 mb-4">
                        В разделе настроек вы можете:
                    </p>
                    <ul className="list-none p-0 m-4">
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Добавлять новые сайты с ключевыми словами</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Удалять ненужные сайты</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Просматривать список всех сохраненных сайтов</li>
                    </ul>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0">
                        Чтобы открыть настройки, нажмите на иконку шестеренки в правом верхнем углу главной страницы.
                    </p>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Расширение для браузера</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0 mb-4">
                        Также доступно расширение для Chrome, которое позволяет использовать функционал 
                        прямо из адресной строки браузера. Введите <code className="bg-[var(--hover)] px-2 py-1 rounded text-sm text-[var(--text)] border border-[var(--border)]">go</code> в адресной строке, 
                        затем пробел и ключевое слово сайта.
                    </p>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0">
                        Чтобы установить расширение, нажмите на синюю кнопку "Установить расширение" 
                        в правом верхнем углу.
                    </p>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Советы</h2>
                    <ul className="list-none p-0 m-4">
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Используйте короткие и запоминающиеся ключевые слова</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Добавляйте описания для сайтов, чтобы легче их находить</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Используйте автодополнение в поисковой строке для быстрого выбора</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Кликните на иконку сайта для мгновенного перехода</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

