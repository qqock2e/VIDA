import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VIDA POKER",
  description: "7-card poker roguelike - Survive, strategize, and conquer!",
  keywords: ["VIDA POKER", "poker", "roguelike", "card game"],
  authors: [{ name: "VIDA" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "VIDA POKER",
    description: "7-card poker roguelike - Survive, strategize, and conquer!",
    siteName: "VIDA POKER",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIDA POKER",
    description: "7-card poker roguelike - Survive, strategize, and conquer!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
