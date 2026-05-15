// src/components/about/DisclosureSection.tsx
export default function DisclosureSection() {
  return (
    <section className="section-white">
      <div className="container-grid">
        <div>
          <p className="eyebrow">Independent & Transparent</p>

          <h2 className="section-title">
            Privately owned, locally focused, and separate from state tourism.
          </h2>
        </div>

        <div>
          <p className="section-lead">
            Natural State Tourism Project is privately owned and is not
            affiliated with the State of Arkansas or any government tourism
            organization.
          </p>

          <p className="section-text">
            Some featured placements, business spotlights, or advertising
            opportunities may be paid partnerships. Our goal is to keep those
            placements useful, relevant, and clearly connected to local tourism
            discovery.
          </p>

          <p className="section-text">
            The project is operated separately from our development services,
            though both share the same larger goal: helping Arkansas businesses
            build a stronger online presence.
          </p>
        </div>
      </div>
    </section>
  );
}