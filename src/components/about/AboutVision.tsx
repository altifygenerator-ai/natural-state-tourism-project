// src/components/about/AboutVision.tsx
export default function AboutVision() {
  return (
    <section className="section-paper">
      <div className="container-grid">
        <div>
          <p className="eyebrow">Our Mission</p>

          <h2 className="section-title">
            Growing Arkansas tourism with modern local guide websites.
          </h2>

          <p className="section-lead">
            We’re focused on building useful, community-driven tourism guides
            that help people find towns, restaurants, lodging, attractions,
            outdoor recreation, shops, and small businesses across Arkansas.
          </p>

          <p className="section-text">
            The goal is simple: make Arkansas easier to explore while helping
            local businesses show up better online for people already planning
            trips, weekend visits, and local experiences.
          </p>
        </div>

        <div className="image-card">
          <div
            className="image-tall"
            style={{
              backgroundImage: "url('/images/mulberry-river.webp')",
            }}
          />
        </div>
      </div>
    </section>
  );
}