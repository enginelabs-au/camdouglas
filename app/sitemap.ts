import type { MetadataRoute } from "next";
import { routeByDestination } from "@/lib/routes";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return Object.values(routeByDestination).map((path) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/reviews" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
