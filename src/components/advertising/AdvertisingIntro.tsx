// src/components/advertising/AdvertisingIntro.tsx
export default function AdvertisingIntro() {
  return (
    <section className="section-paper">
      <div className="container-grid">
        <div>
          <p className="eyebrow">Why Featured Placement?</p>

          <h2 className="section-title">
            Built to feel useful to travelers, not like random banner ads.
          </h2>
        </div>

        <div>
          <p className="section-lead">
            Featured businesses receive stronger visibility throughout the guide
            network with placements designed around tourism discovery, lodging,
            restaurants, attractions, and local services.
          </p>

          <p className="section-text">
            The goal is to create placements that actually help travelers find
            businesses they may genuinely want to visit while helping local
            companies gain stronger long-term online visibility.
          </p>
        </div>
      </div>
    </section>
  );
}