// src/app/network/page.tsx
import type { Metadata } from "next";
import NetworkHero from "@/components/network/NetworkHero";
import NetworkGrid from "@/components/network/NetworkGrid";
import ExpansionMap from "@/components/network/ExpansionMap";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Arkansas Tourism Guide Network",
  description:
    "Explore the Natural State Tourism Project network, including Hot Springs, Glenwood, Mount Ida, Amity, and Murfreesboro Arkansas guide sites.",
  alternates: {
    canonical: "/network",
  },
  openGraph: {
    title: "Arkansas Tourism Guide Network",
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
