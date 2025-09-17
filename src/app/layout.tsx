import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";

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
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  ); 
}
