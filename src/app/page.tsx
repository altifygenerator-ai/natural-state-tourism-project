// src/app/page.tsx
import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import MissionPreview from "@/components/home/MissionPreview";
import NetworkPreview from "@/components/home/NetworkPreview";
import AdvertisingPreview from "@/components/home/AdvertisingPreview";
import FutureExpansion from "@/components/home/FutureExpansion";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <MissionPreview />
      <NetworkPreview />
      <AdvertisingPreview />
      <FutureExpansion />
      <CTASection />
    </>
  );
}