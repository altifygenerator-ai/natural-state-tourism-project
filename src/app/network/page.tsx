import ChooseYourTrip from "@/components/network/ChooseYourTrip";
// src/app/network/page.tsx
import type { Metadata } from "next";
import NetworkHero from "@/components/network/NetworkHero";
import NetworkGrid from "@/components/network/NetworkGrid";
import ExpansionMap from "@/components/network/ExpansionMap";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: { absolute: "Arkansas Town Guides | Hot Springs, Glenwood & Beyond" },
  description: "Choose a local Arkansas guide for Bathhouse Row, the Caddo River, crystal mining, Crater of Diamonds or a quieter Amity visit. Plan food and stays nearby.",
  alternates: {
    canonical: "/network",
  },
  openGraph: {
    title: "Arkansas Town Guides | Hot Springs, Glenwood & Beyond",
    description: "Choose a local Arkansas guide for Bathhouse Row, the Caddo River, crystal mining, Crater of Diamonds or a quieter Amity visit. Plan food and stays nearby.",
    url: "/network",
  },
};

export default function NetworkPage() {
  return (
    <>
      <NetworkHero />
      <ChooseYourTrip />
      <NetworkGrid />
      <ExpansionMap />
      <CTASection />
    </>
  );
}
