import type { Metadata } from "next";
import { site } from "@/config/site";

export const ogImage = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Cam Douglas: an ASCII galaxy with the name CAM over it.",
};

// Search results read the title and description, so they carry the terms people search for.
export const homeTitle = "Cam Douglas | Music producer, software engineer and founder";
export const homeDescription =
  "Music producer, audio engineer, DJ, software engineer and founder in Sydney. Music production education and Engine Labs, an AI build studio.";

// Link previews (iMessage, LinkedIn, X and so on) use the tagline and new positioning.
export const socialTitle = "Cam Douglas | Tinkerer, Solopreneur and Creative Technologist";
export const socialDescription = site.tagline;

type PageMeta = {
  path: string;
  // Short page name. The site name is appended. Leave out for the home page.
  title?: string;
  description: string;
  // Optional separate title and description for link previews.
  social?: { title: string; description: string };
};

export function pageMetadata({ path, title, description, social }: PageMeta): Metadata {
  const fullTitle = title ? `${title} | ${site.name}` : homeTitle;
  const previewTitle = social?.title ?? fullTitle;
  const previewDescription = social?.description ?? description;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: previewTitle,
      description: previewDescription,
      url: path,
      siteName: site.name,
      locale: "en_AU",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: previewTitle,
      description: previewDescription,
      images: [ogImage.url],
    },
  };
}
