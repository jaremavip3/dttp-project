import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "StyleAI - AI-Powered Fashion Discovery",
    template: "%s | StyleAI",
  },
  description:
    "Discover fashion with AI-powered semantic search. Find exactly what you're looking for with natural language search.",
  keywords: "fashion, AI search, clothing, e-commerce, style, CLIP, semantic search",
  authors: [{ name: "StyleAI Team" }],
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://styleai.com",
    title: "StyleAI - AI-Powered Fashion Discovery",
    description:
      "Discover fashion with AI-powered semantic search. Find exactly what you're looking for with natural language search.",
    siteName: "StyleAI",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "dns-prefetch": process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
