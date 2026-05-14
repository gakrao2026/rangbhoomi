import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rangbhoomi — Indian Cultural Life in America',
  description: 'Community-curated directory of Indian cultural events, restaurants, and movie theaters across the US.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-amber-50 text-stone-900 font-sans antialiased">
        <header className="bg-white border-b border-amber-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-2xl">🪔</span>
              <div>
                <span className="font-semibold text-lg text-stone-900 tracking-tight">Rangbhoomi</span>
                <span className="ml-2 text-xs text-stone-400 hidden sm:inline">रंगभूमि</span>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              {[['/', 'Explore'], ['/discover', 'AI Discover'], ['/submit', 'Submit'], ['/admin', 'Admin']].map(([href, label]) => (
                <Link key={href} href={href} className="px-3 py-1.5 rounded-md text-sm text-stone-600 hover:bg-amber-100 hover:text-amber-800 transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-amber-200 mt-16 py-8 text-center text-sm text-stone-400 bg-white">
          <p>Rangbhoomi · Community-curated · Open contributions welcome</p>
          <p className="mt-1">
            <Link href="/submit" className="hover:text-amber-600 transition-colors">Submit a listing</Link>
            {' · '}
            <a href="https://github.com" className="hover:text-amber-600 transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
