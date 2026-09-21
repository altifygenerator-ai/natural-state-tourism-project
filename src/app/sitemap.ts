import type { MetadataRoute } from "next";

const siteUrl = "https://www.naturalstatetourismproject.org";
const contentUpdated = new Date("2026-09-20T00:00:00-05:00");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: contentUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: contentUpdated,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/network`,
      lastModified: contentUpdated,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/advertising`,
      lastModified: contentUpdated,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: contentUpdated,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
