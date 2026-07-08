// src/app/advertising/page.tsx
import type { Metadata } from "next";
import AdvertisingHero from "@/components/advertising/AdvertisingHero";
import AdvertisingIntro from "@/components/advertising/AdvertisingIntro";
import PlacementTypes from "@/components/advertising/PlacementTypes";
import FeaturedExample from "@/components/advertising/FeaturedExample";
import PricingSection from "@/components/advertising/PricingSection";
import PartnerCTA from "@/components/advertising/PartnerCTA";

export const metadata: Metadata = {
  title: "Advertise With Natural State Tourism Project",
  description:
    "Featured placement and business spotlight options for Arkansas businesses that want visibility inside local tourism guide pages.",
  alternates: {
    canonical: "/advertising",
  },
  openGraph: {
    title: "Advertise With Natural State Tourism Project",
    description:
      "Featured placement and spotlight options for Arkansas businesses inside local tourism guide pages.",
    url: "/advertising",
  },
};

export default function AdvertisingPage() {
  return (
    <>
      <AdvertisingHero />
      <AdvertisingIntro />
      <PlacementTypes />
      <FeaturedExample />
      <PricingSection />
      <PartnerCTA />
    </>
  );
}
