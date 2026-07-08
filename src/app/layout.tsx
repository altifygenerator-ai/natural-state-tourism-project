// src/app/layout.tsx
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Playfair_Display, Manrope } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const heading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["700", "800", "900"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const siteUrl = "https://naturalstatetourismproject.org";
const ogImage = `${siteUrl}/images/natural-state-og.png`;

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Natural State Tourism Project",
  url: siteUrl,
  logo: `${siteUrl}/images/logo.png`,
  description:
    "An independent Arkansas tourism guide network helping travelers discover local towns, attractions, restaurants, lodging, events, outdoor spots, and small businesses.",
  sameAs: [
    "https://hotspringsarkansas.org",
    "https://glenwoodarkansas.org",
    "https://mountidaarkansas.org",
    "https://amityarkansas.org",
    "https://murfreesboroarkansas.org",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  verification: {
    google: "FreW2NoyKjt3MqR9omPpGDeNElSGvbA_xTIHW6Hgc4w",
  },

  title: {
    default:
      "Natural State Tourism Project | Independent Arkansas Tourism Guide Network",
    template: "%s | Natural State Tourism Project",
  },

  description:
    "Natural State Tourism Project is an independent Arkansas tourism guide network helping travelers discover local towns, attractions, restaurants, lodging, and small businesses.",

  keywords: [
    "Natural State Tourism Project",
    "Arkansas tourism guide",
    "Arkansas travel guide",
    "Arkansas local business directory",
    "Arkansas small business exposure",
    "Hot Springs Arkansas guide",
    "Glenwood Arkansas guide",
    "Mount Ida Arkansas guide",
    "Amity Arkansas guide",
    "Murfreesboro Arkansas guide",
    "Crater of Diamonds guide",
    "Lake Greeson guide",
    "Arkansas tourism advertising",
    "Arkansas featured business listings",
  ],

  openGraph: {
    title: "Natural State Tourism Project",
    description:
      "An independent Arkansas tourism guide network built to help travelers discover local towns and small businesses.",
    url: siteUrl,
    siteName: "Natural State Tourism Project",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Natural State Tourism Project Arkansas tourism guide network",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Natural State Tourism Project",
    description:
      "Independent Arkansas tourism guide network helping travelers discover local towns and businesses.",
    images: [ogImage],
  },

  icons: {
    icon: "/favicon.ico",
  },

  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
