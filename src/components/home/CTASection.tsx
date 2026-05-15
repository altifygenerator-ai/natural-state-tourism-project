// src/components/home/CTASection.tsx
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-card">
        <p className="eyebrow-light">
          Get Involved
        </p>

        <h2 className="section-title-light">
          Want to feature a business or suggest a local favorite?
        </h2>

        <p className="section-text-light centered">
          Reach out for advertising, featured placement, partnerships,
          suggestions, or future Arkansas guide coverage ideas.
        </p>

        <div className="hero-actions">
          <Link href="/advertising" className="btn-gold">
            Advertise With Us
          </Link>

          <Link href="/contact" className="btn-outline-light">
            Send A Suggestion
          </Link>
        </div>
      </div>
    </section>
  );
}