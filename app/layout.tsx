import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ClientProviders } from "@/src/components/ClientProviders";
import Providers from "../src/components/StoreProvider";
import { vazirmatn } from "@/app/vazirmatn";
import { PWARegister } from "@/src/components/PWARegister";
import { ClientInfoInitializer } from "@/src/components/ClientInfoInitializer";
import { DeviceIdInitializer } from "@/src/components/DeviceIdInitializer";
import { NextAuthProvider } from "@/src/components/auth/NextAuthProvider";
import { SilentRefreshProvider } from "@/src/components/auth/SilentRefreshProvider";
import { AuthSessionSync } from "@/src/components/auth/AuthSessionSync";
import { RayChatUserSetter } from "@/src/components/RayChatUserSetter";
import { AppBranding } from "@/src/components/AppBranding";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// Extend Window interface for RayChat
declare global {
  interface Window {
    Raychat?: {
      setUser: (user: any) => void;
      on: (event: string, callback: (data?: any) => void) => void;
    };
    RAYCHAT_TOKEN?: string;
  }
}

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
      <body className={`${vazirmatn.variable} min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300`}>
          <PWARegister />
          <NextAuthProvider session={session}>
            <Providers>
              <AuthSessionSync />
              <SilentRefreshProvider>
                <ClientProviders>
                  <DeviceIdInitializer />
                  <ClientInfoInitializer />
                  <RayChatUserSetter />

                  {/* Desktop Layout with Branding */}
                  <div className="hidden lg:flex lg:min-h-screen lg:overflow-hidden">
                    <div className="container mx-auto max-w-7xl px-8 xl:px-12 flex">
                    {/* Main Content Area */}
                    <div className="lg:flex-1 lg:flex lg:flex-col lg:max-w-[30rem] xl:max-w-[30rem]">
                      {children}
                    </div>

                    {/* Desktop Branding Banner */}
                    <div className="lg:flex lg:flex-1 lg:items-center lg:justify-center lg:p-6">
                      <AppBranding />
                    </div>
                    </div>
                  </div>

                  {/* Mobile/Tablet Layout */}
                  <div className="lg:hidden">
                  {children}
                  </div>
                </ClientProviders>
              </SilentRefreshProvider>
            </Providers>
          </NextAuthProvider>

          {/* RayChat Widget Script */}
          <Script
            id="raychat-widget"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.RAYCHAT_TOKEN = "5bc05a29-6560-4d8d-bdab-094078904e83";

                (function() {
                  var d = document, s = d.createElement('script');
                  s.src = 'https://widget-react.raychat.io/install/widget.js';
                  s.async = 1;
                  d.head.appendChild(s);
                })();

                // RayChat event listeners
                window.addEventListener('raychat_ready', function() {
                  if (window.Raychat) {
                    // Handle chat close event - redirect to dashboard
                    window.Raychat.on('close', function(s) {
                      window.location.href = '/dashboard';
                    });

                    // Set user info if available
                    try {
                      const userInfo = localStorage.getItem('raychat_user_info');
                      if (userInfo) {
                        const user = JSON.parse(userInfo);
                        window.Raychat.setUser(user);
                      }
                    } catch (e) {
                      console.log('RayChat user info not set');
                    }
                  }
                });
              `,
            }}
          />
      </body>
    </html>
  );
}
