import type { MetadataRoute } from "next";
import { integrations } from "@/config/integrations";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: integrations.siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
