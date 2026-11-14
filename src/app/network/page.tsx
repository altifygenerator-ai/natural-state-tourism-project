// src/app/network/page.tsx
import type { Metadata } from "next";
import NetworkHero from "@/components/network/NetworkHero";
import NetworkGrid from "@/components/network/NetworkGrid";
import ExpansionMap from "@/components/network/ExpansionMap";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Arkansas Travel Guides for Five Ouachita Area Towns",
  description:
    "Choose a local guide to Hot Springs, Glenwood, Mount Ida, Amity, or Murfreesboro. Find things to do, places to stay, and stops to pair on an Arkansas road trip.",
  alternates: {
    canonical: "/network",
  },
  openGraph: {
    title: "Arkansas Travel Guides for Five Ouachita Area Towns",
    description:
      "Explore active Arkansas guide sites from the Natural State Tourism Project.",
    url: "/network",
  },
};

export default function NetworkPage() {
  return (
    <>
      <NetworkHero />
      <NetworkGrid />
      <ExpansionMap />
      <CTASection />
    </>
  );
}
