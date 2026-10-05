import ChooseYourTrip from "@/components/network/ChooseYourTrip";
export const metadata = { title: { absolute: "Arkansas Local Travel Guides | Natural State Tourism Project" }, description: "Explore five local Arkansas guides for Hot Springs, Glenwood, Mount Ida, Murfreesboro and Amity. Find things to do, restaurants, stays and trip ideas." };

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
      <ChooseYourTrip />
      <TrustStrip />
      <MissionPreview />
      <NetworkPreview />
      <AdvertisingPreview />
      <FutureExpansion />
      <CTASection />
    </>
  );
}