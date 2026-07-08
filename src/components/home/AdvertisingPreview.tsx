// src/components/home/AdvertisingPreview.tsx
import Link from "next/link";

export default function AdvertisingPreview() {
  return (
    <section className="advertising-section">
      <div className="advertising-grid">
        <div>
          <p className="eyebrow-light">
            For Local Businesses
          </p>

          <h2 className="section-title-light">
            Featured placement that feels like part of the guide.
          </h2>

          <p className="section-text-light">
            Businesses can partner with the Natural State Tourism Project for
            featured placement, stronger category visibility, and dedicated
            spotlight pages inside the tourism guide network.
          </p>

          <Link href="/advertising" className="btn-gold">
            See Featured Placement Info
          </Link>
        </div>

        <div className="featured-preview-card">
          <p className="featured-badge">
            Featured Local Partner
          </p>

          <div className="featured-image-placeholder">
  <img
    src="/images/featured-hotel.png"
    alt="Featured hotel in Hot Springs"
    className="featured-image"
  />
</div>

          <h3 className="card-title-dark">
            Business Spotlight Page
          </h3>

          <p className="card-text-dark">
            Featured partners can receive larger placements, photos, direct
            links, and dedicated spotlight pages inside the local guide.
          </p>
        </div>
      </div>
    </section>
  );
}