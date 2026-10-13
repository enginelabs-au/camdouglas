import type { Metadata } from "next";
import { site } from "@/config/site";

export const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Cam Douglas: an ASCII galaxy with the name CAM over it.",
};

export const homeTitle = "Cam Douglas | Tinkerer, Solopreneur and Creative Technologist";

type PageMeta = {
  path: string;
  // Short page name. The site name is appended. Leave out for the home page.
  title?: string;
  description: string;
};

export function pageMetadata({ path, title, description }: PageMeta): Metadata {
  const fullTitle = title ? `${title} | ${site.name}` : homeTitle;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: site.name,
      locale: "en_AU",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}
