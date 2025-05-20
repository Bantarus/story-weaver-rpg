
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Lora } from 'next/font/google';
import './globals.css';
import { GameProvider } from '@/context/GameContext';
import { SettingsProvider } from '@/context/SettingsContext'; // Added
import { Header } from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  weight: ['400', '700'], // Include weights you'll use
});

export const metadata: Metadata = {
  title: 'Story Weaver RPG',
  description: 'Create your own personalized text-based RPG adventure!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased flex flex-col min-h-screen`}>
        <SettingsProvider> {/* Added SettingsProvider */}
          <GameProvider>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster />
          </GameProvider>
        </SettingsProvider> {/* Added SettingsProvider */}
      </body>
    </html>
  );
}
