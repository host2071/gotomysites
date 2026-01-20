"use client";

import Link from "next/link";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Go My Sites";

export default function HelpPage() {
    return (
        <div className="min-h-screen px-5 py-20 max-w-[900px] mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <Link href="/" className="text-[var(--google-blue)] no-underline text-sm transition-opacity hover:opacity-80">
                    ← Back
                </Link>
                <h1 className="text-[32px] font-normal m-0 text-[var(--text)]">Help</h1>
            </header>

            <div className="flex flex-col gap-8">
                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">What is {APP_NAME}?</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0 mb-4">
                        {APP_NAME} is a web app for fast access to your favorite websites. 
                        Type a short keyword in the search bar and you will instantly jump to the right site.
                    </p>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Key features</h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mt-5">
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">🔍 Quick navigation</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                Type a website keyword in the search bar (for example, "youtube") and press Enter. 
                                You will be redirected straight to that website.
                            </p>
                        </div>
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">🔎 Search on websites</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                You can search directly on a website. Type a keyword and then your query 
                                (for example, "youtube react tutorial") and you will land on the search results page of that site.
                            </p>
                        </div>
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">📱 Quick access grid</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                The home page shows a grid of your popular sites. 
                                Just click a site icon to open it instantly.
                            </p>
                        </div>
                        <div className="p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <h3 className="text-lg font-medium m-0 mb-3 text-[var(--text)]">⚙️ Manage your sites</h3>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">
                                In Settings you can add new sites, remove existing ones, and configure keywords 
                                for quick access.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">How to use it</h2>
                    <div className="flex flex-col gap-5 mt-5">
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">1</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Go to a website</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    Type a keyword in the search bar and press Enter. 
                                    Example: <code className="bg-[var(--hover)] px-2 py-1 rounded text-sm text-[var(--text)] border border-[var(--border)]">youtube</code> → opens YouTube
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">2</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Search on a website</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    Type a keyword and your search query separated by a space. 
                                    Example: <code className="bg-[var(--hover)] px-2 py-1 rounded text-sm text-[var(--text)] border border-[var(--border)]">youtube react hooks</code> → opens YouTube with search "react hooks"
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">3</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Click on an icon</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    On the home page, click a site icon in the grid 
                                    to open it without typing anything.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-5 items-start p-5 bg-[var(--hover)] rounded-lg border border-[var(--border)]">
                            <div className="w-10 h-10 rounded-full bg-[var(--google-blue)] text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">4</div>
                            <div className="flex-1">
                                <h3 className="mb-2 text-[var(--text)]">Add new websites</h3>
                                <p className="m-0 text-[var(--text-secondary)]">
                                    Go to Settings (gear icon in the top-right corner), 
                                    fill in the form and add a new website with a keyword.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Examples</h2>
                    <div className="flex flex-col gap-4 mt-5">
                        <div className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <code className="bg-[var(--bg)] px-3 py-2 rounded text-sm text-[var(--text)] inline-block border border-[var(--border)]">google</code>
                            </div>
                            <div className="text-xl text-[var(--text-secondary)] font-semibold">→</div>
                            <div className="flex-1 min-w-[200px] text-[var(--text-secondary)] text-sm">
                                Opens Google
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <code className="bg-[var(--bg)] px-3 py-2 rounded text-sm text-[var(--text)] inline-block border border-[var(--border)]">youtube react tutorial</code>
                            </div>
                            <div className="text-xl text-[var(--text-secondary)] font-semibold">→</div>
                            <div className="flex-1 min-w-[200px] text-[var(--text-secondary)] text-sm">
                                Opens YouTube with search "react tutorial"
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-[var(--hover)] rounded-lg flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <code className="bg-[var(--bg)] px-3 py-2 rounded text-sm text-[var(--text)] inline-block border border-[var(--border)]">github typescript</code>
                            </div>
                            <div className="text-xl text-[var(--text-secondary)] font-semibold">→</div>
                            <div className="flex-1 min-w-[200px] text-[var(--text-secondary)] text-sm">
                                Opens GitHub with search "typescript"
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Settings</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0 mb-4">
                        In the Settings section you can:
                    </p>
                    <ul className="list-none p-0 m-4">
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Add new websites with keywords</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Remove websites you no longer need</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">View the list of all saved websites</li>
                    </ul>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0">
                        To open Settings, click the gear icon in the top-right corner of the home page.
                    </p>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Browser extension</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0 mb-4">
                        There is also a Chrome extension that lets you use this functionality 
                        directly from the browser address bar. Type <code className="bg-[var(--hover)] px-2 py-1 rounded text-sm text-[var(--text)] border border-[var(--border)]">go</code> in the address bar, 
                        then a space and your website keyword.
                    </p>
                    <p className="text-[15px] leading-relaxed text-[var(--text)] m-0">
                        To install the extension, click the blue "Install extension" button 
                        in the top-right corner.
                    </p>
                </section>

                <section className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-6">
                    <h2 className="text-2xl font-normal m-0 mb-4 text-[var(--text)]">Tips</h2>
                    <ul className="list-none p-0 m-4">
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Use short, memorable keywords</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Add descriptions to sites to make them easier to find</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Use autocomplete in the search bar to select sites faster</li>
                        <li className="py-2 pl-6 relative text-[var(--text-secondary)] text-[15px] leading-relaxed before:content-['•'] before:absolute before:left-2 before:text-[var(--google-blue)] before:font-bold">Click on site icons for instant navigation</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

