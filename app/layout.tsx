import "./globals.css";
import type {Metadata} from "next";
import {ClientProviders} from "@/src/components/ClientProviders";
import Providers from "../src/components/StoreProvider";
import {ErrorBoundary} from "@/src/components/ErrorBoundary";
import {vazirmatn} from "@/app/vazirmatn";
import {PWARegister} from "@/src/components/PWARegister";

export const metadata: Metadata = {
  title: "سامانه رفاهی",
  description: "سامانه رفاهی - اپلیکیشن وب پیشرو",
  manifest: "/manifest.json",
  themeColor: "#3A3080",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "سامانه رفاهی",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "سامانه رفاهی",
    title: "سامانه رفاهی",
    description: "سامانه رفاهی - اپلیکیشن وب پیشرو",
  },
  twitter: {
    card: "summary",
    title: "سامانه رفاهی",
    description: "سامانه رفاهی - اپلیکیشن وب پیشرو",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  icons: {
    icon: [
      { url: "/logo-blue.png", sizes: "any", type: "image/png" },
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo-blue.png", sizes: "any", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head />
      <body className={`${vazirmatn.variable}`}>
        <PWARegister />
        <ErrorBoundary>
          <Providers>
            <ClientProviders>
              {children}
            </ClientProviders>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
