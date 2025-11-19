import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ClientProviders } from "@/src/components/ClientProviders";
import Providers from "../src/components/StoreProvider";
import { vazirmatn } from "@/app/vazirmatn";
import { PWARegister } from "@/src/components/PWARegister";
import { ClientInfoInitializer } from "@/src/components/ClientInfoInitializer";
import { DeviceIdInitializer } from "@/src/components/DeviceIdInitializer";
import { NextAuthProvider } from "@/src/components/auth/NextAuthProvider";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export const metadata: Metadata = {
  title: "سامانه رفاهی",
  description: "سامانه رفاهی - اپلیکیشن وب پیشرو",
  manifest: "/manifest.json",
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
  icons: {
    icon: [{ url: "/logo-blue.png", sizes: "any", type: "image/png" }],
    apple: [{ url: "/logo-blue.png", sizes: "any", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3A3080",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Optionally fetch session server-side and pass to SessionProvider
  // This improves initial render performance and SSR
  // If not passed, SessionProvider will fetch it automatically on the client
  const session = await auth();

  return (
    <html lang="fa" dir="rtl">
      <head />
      <body className={`${vazirmatn.variable}`}>
          <PWARegister />
          <NextAuthProvider session={session}>
              <Providers>
                <ClientProviders>
                  <DeviceIdInitializer />
                  <ClientInfoInitializer />
                  {children}
                </ClientProviders>
              </Providers>
          </NextAuthProvider>
      </body>
    </html>
  );
}
