import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { AuthProvider } from '@/lib/auth/context';

export const metadata: Metadata = {
  title: 'AdaptiveLearn · AI Personalized Learning Platform',
  description: 'Deterministic skill-gap analysis, topological prerequisite ordering, and continuous adaptive learning on Fluxbase.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-neutral-900 min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="w-full border-t border-neutral-200/80 py-8 bg-neutral-50/50 text-xs text-neutral-500">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-900">AdaptiveLearn</span>
                <span>·</span>
                <span>Personalized AI Learning Platform</span>
              </div>
              <div className="flex items-center gap-4 text-neutral-400">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Fluxbase Database Active
                </span>
                <span>·</span>
                <span className="font-mono text-[11px] text-neutral-600">Deterministic Graph Engine</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
