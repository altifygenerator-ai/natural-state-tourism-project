// src/app/about/page.tsx
import AboutMission from "@/components/about/AboutMission";
import AboutVision from "@/components/about/AboutVision";
import FounderSection from "@/components/about/FounderSectionV2";
import FutureGoals from "@/components/about/FutureGoals";
import DisclosureSection from "@/components/about/DisclosureSection";
import CTASection from "@/components/home/CTASection";

export default function AboutPage() {
  return (
    <>
      <AboutMission />
      <AboutVision />
      <FounderSection />
      <FutureGoals />
      <DisclosureSection />
      <CTASection />
    </>
  );
}