// src/app/about/page.tsx
import type { Metadata } from "next";
import AboutMission from "@/components/about/AboutMission";
import AboutVision from "@/components/about/AboutVision";
import FounderSection from "@/components/about/FounderSectionV2";
import FutureGoals from "@/components/about/FutureGoals";
import DisclosureSection from "@/components/about/DisclosureSection";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "About Natural State Tourism Project",
  description:
    "Learn about the independent Arkansas tourism guide network built to help visitors find towns, local businesses, lodging, restaurants, and outdoor stops.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Natural State Tourism Project",
    description:
      "An independent Arkansas tourism guide network focused on local towns, small businesses, and visitor discovery.",
    url: "/about",
  },
};

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
