import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Libre_Baskerville } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { site, socialLinks } from "@/config/site";
import { homeTitle, ogImage } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Only used on review cards, so it loads when needed instead of delaying first paint.
const reviewSerif = Libre_Baskerville({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-review",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03050a",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: homeTitle, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description: site.description,
    url: "/",
    siteName: site.name,
    locale: "en_AU",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: site.description,
    images: [ogImage.url],
  },
};

// Structured data so search engines connect the site, the person and their profiles.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "en-AU",
      publisher: { "@id": `${site.url}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.name,
      url: site.url,
      description: site.description,
      jobTitle: "Creative technologist and founder",
      image: `${site.url}${ogImage.url}`,
      address: { "@type": "PostalAddress", addressLocality: "Sydney", addressCountry: "AU" },
      knowsAbout: ["Music production", "Audio engineering", "DJing", "Software engineering", "Creative technology"],
      worksFor: { "@type": "Organization", name: "Engine Labs", url: "https://enginelabs.com.au" },
      sameAs: socialLinks.map((link) => link.href),
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} ${reviewSerif.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
