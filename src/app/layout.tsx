"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initGA, trackEvent } from "@/lib/analytics";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matet y sus fiestas",
  description: "Enterate de todas las fiestas que se hagan en MATET",
  icons: {
    // Favicon / fallback icons
    icon: [
      { url: "/favicon.ico" },
      { url: "/logoMatet.png", type: "image/png" },
    ],
    // iOS Home Screen icon
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    // optional shortcut icon
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", 
    title: "Matet y sus fiestas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize Google Analytics once
  useEffect(() => {
    initGA();
  }, []);

  // Track page view on route/searchParams change
  useEffect(() => {
    if (!pathname) return;
    trackEvent("page_view");
  }, [pathname, searchParams]);

  // Track time on page for each route
  useEffect(() => {
    const start = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - start) / 1000);
      trackEvent("time_on_page", { seconds });
    };
  }, [pathname, searchParams]);

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
