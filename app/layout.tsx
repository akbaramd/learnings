import "./globals.css";
import type { Metadata } from "next";
import { ClientProviders } from "../src/components/ClientProviders";
import Providers from "../src/components/StoreProvider";

import { Vazirmatn } from 'next/font/google';

export const vazirmatn = Vazirmatn({
  // Pick only what you need to minimize CSS size
  subsets: ['arabic', 'latin'],
  // Choose the exact weights you actually use
  weight: ['300', '400', '500', '600', '700'],
  // Expose a CSS variable for Tailwind 4 integration
  variable: '--font-vazirmatn',
  // Good default to avoid FOIT
  display: 'swap',
  // Optional: limit to normal style if you don’t use italics
  style: ['normal'],
});

export const metadata: Metadata = {
  title: "App",
  description: "Root layout",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head />
      <body className={`${vazirmatn.variable}`}>
        <Providers>
          <ClientProviders>
            {children}
          </ClientProviders>
        </Providers>
      </body>
    </html>
  );
}
