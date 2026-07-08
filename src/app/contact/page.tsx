// src/app/contact/page.tsx
import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ContactMethods from "@/components/contact/ContactMethods";
import SuggestionSection from "@/components/contact/SuggestionSection";
import ContactFAQ from "@/components/contact/ContactFAQ";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Natural State Tourism Project",
  description:
    "Contact Natural State Tourism Project for Arkansas guide suggestions, featured placement, business spotlights, events, and local tourism partnerships.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Natural State Tourism Project",
    description:
      "Send guide suggestions, business inquiries, event ideas, and partnership questions.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactMethods />
      <ContactForm />
      <SuggestionSection />
      <ContactFAQ />
    </>
  );
}
