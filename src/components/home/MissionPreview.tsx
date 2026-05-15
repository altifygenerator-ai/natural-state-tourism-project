// src/components/home/MissionPreview.tsx
import Link from "next/link";

export default function MissionPreview() {
  return (
    <section className="section-paper">
      <div className="container-grid">
        <div>
          <p className="eyebrow">Our Mission</p>

          <h2 className="section-title">
            Growing Arkansas tourism while giving local businesses more exposure.
          </h2>

          <p className="section-lead">
            We’re a privately owned Arkansas-based tourism network focused on
            helping grow tourism across the state while giving local businesses
            more online visibility and exposure to travelers exploring Arkansas.
          </p>

          <p className="section-text">
            Our guides help people discover the towns, restaurants, attractions,
            lodging, outdoor recreation, shops, and small businesses that make
            Arkansas worth exploring.
          </p>

          <Link href="/about" className="btn-dark">
            Learn More About Us
          </Link>
        </div>

        <div className="image-card">
          <div
            className="image-tall"
            style={{
              backgroundImage: "url('/images/arkansas-scenic.webp')",
            }}
          />
        </div>
      </div>
    </section>
  );
}