// src/components/about/FounderSection.tsx
export default function FounderSection() {
  return (
    <section className="section-white">
      <div className="container-grid">
        <div className="image-card">
          <div
            className="image-tall"
            style={{
              backgroundImage: "url('/images/arkansas-founder.jpg')",
            }}
          />
        </div>

        <div>
          <p className="eyebrow">Founder</p>

          <h2 className="section-title">
            Built by someone with deep Arkansas roots.
          </h2>

          <p className="section-lead">
            Natural State Tourism Project was founded by Jake Howard, with
            family roots in Arkansas stretching back generations to the Civil
            War era and family land still connected to the Amity area today.
          </p>

          <p className="section-text">
            The project started from a simple idea: Arkansas has countless local
            businesses, towns, restaurants, attractions, cabins, and outdoor
            destinations that deserve better online visibility and modern
            tourism-focused presentation.
          </p>

          <p className="section-text">
            Beyond tourism guides, the larger goal is helping Arkansas
            businesses gain exposure in multiple ways through stronger digital
            presence, local discovery, and modern web platforms.
          </p>
        </div>
      </div>
    </section>
  );
}