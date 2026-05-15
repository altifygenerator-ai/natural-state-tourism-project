// src/app/network/page.tsx
import NetworkHero from "@/components/network/NetworkHero";
import NetworkGrid from "@/components/network/NetworkGrid";
import ExpansionMap from "@/components/network/ExpansionMap";
import CTASection from "@/components/home/CTASection";

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