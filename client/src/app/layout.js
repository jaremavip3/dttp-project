import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import PerformanceDashboard from "@/components/PerformanceDashboard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
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
  verification: {
    google: 'your-google-verification-code', // Add when you have it
  },
  other: {
    "dns-prefetch": process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} />
        <link rel="dns-prefetch" href="https://owtqoapmmmupfmhyhsuz.supabase.co" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <WebVitalsReporter />
        <PerformanceDashboard />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
