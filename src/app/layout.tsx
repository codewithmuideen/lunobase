import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SITE_NAME, SITE_URL } from "@/lib/env";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

const description =
  "Buy, sell and manage Bitcoin, Ethereum, Solana and more on Lunobase - a secure, regulated-grade digital asset platform with live markets, bank-level security and 24/7 support.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lunobase - Buy, Sell & Trade Crypto Securely",
    template: "%s · Lunobase",
  },
  description,
  applicationName: SITE_NAME,
  keywords: [
    "crypto exchange",
    "buy bitcoin",
    "buy ethereum",
    "cryptocurrency trading",
    "digital assets",
    "crypto wallet",
    "secure crypto platform",
    "Lunobase",
  ],
  authors: [{ name: "Lunobase" }],
  creator: "Lunobase",
  publisher: "Lunobase",
  category: "finance",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Lunobase - Buy, Sell & Trade Crypto Securely",
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lunobase - Buy, Sell & Trade Crypto Securely",
    description,
    creator: "@lunobase",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/app-icon-512.png`,
      email: "info@lunobase.com",
      contactPoint: [
        { "@type": "ContactPoint", contactType: "customer support", email: "info@lunobase.com", availableLanguage: ["English"] },
        { "@type": "ContactPoint", contactType: "billing support", email: "payment@lunobase.com", availableLanguage: ["English"] },
      ],
      sameAs: ["https://x.com/lunobase"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/markets?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FinancialService",
      name: SITE_NAME,
      url: SITE_URL,
      description,
      areaServed: "Worldwide",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh overflow-x-clip font-sans">
        {children}
        <CookieConsent />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "!bg-ink-800 !border !border-white/10 !text-white !rounded-xl !shadow-2xl",
              description: "!text-slate",
            },
          }}
        />
        {/* Lunobase uses no service worker. Remove any stale one left on this origin by an older app. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})});if(window.caches){caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})})}}",
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
