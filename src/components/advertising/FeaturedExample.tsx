// src/components/advertising/FeaturedExample.tsx
export default function FeaturedExample() {
  return (
    <section className="advertising-section">
      <div className="advertising-grid">
        <div>
          <p className="eyebrow-light">Featured Example</p>

          <h2 className="section-title-light">
            Larger placements with dedicated visibility.
          </h2>

          <p className="section-text-light">
            Featured businesses can receive larger visual sections, direct
            linking, image-driven presentation, and spotlight pages
            built into the tourism guides.
          </p>
        </div>

        <div className="featured-preview-card">
          <p className="featured-badge">
            Example Featured Partner
          </p>

          <div className="featured-image-placeholder">
            <img
              src="/images/featured-hotel.png"
              alt="Featured hotel"
              className="featured-image"
            />
          </div>

          <h3 className="card-title-dark">
            The Waters Hot Springs
          </h3>

          <p className="card-text-dark">
            Example of a featured lodging placement with stronger visibility,
            imagery, and dedicated visitor-facing coverage.
          </p>
        </div>
      </div>
    </section>
  );
}