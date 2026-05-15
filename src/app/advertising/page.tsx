// src/app/advertising/page.tsx
import AdvertisingHero from "@/components/advertising/AdvertisingHero";
import AdvertisingIntro from "@/components/advertising/AdvertisingIntro";
import PlacementTypes from "@/components/advertising/PlacementTypes";
import FeaturedExample from "@/components/advertising/FeaturedExample";
import PricingSection from "@/components/advertising/PricingSection";
import PartnerCTA from "@/components/advertising/PartnerCTA";

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