// src/app/contact/page.tsx
import ContactHero from "@/components/contact/ContactHero";
import ContactMethods from "@/components/contact/ContactMethods";
import SuggestionSection from "@/components/contact/SuggestionSection";
import ContactFAQ from "@/components/contact/ContactFAQ";
import ContactForm from "@/components/contact/ContactForm";
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