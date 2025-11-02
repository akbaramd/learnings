import "./globals.css";
import type {Metadata} from "next";
import {ClientProviders} from "@/src/components/ClientProviders";
import Providers from "../src/components/StoreProvider";
import {ErrorBoundary} from "@/src/components/ErrorBoundary";
import {vazirmatn} from "@/app/vazirmatn";

export const metadata: Metadata = {
  title: "App",
  description: "Root layout",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head />
      <body className={`${vazirmatn.variable}`}>
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
