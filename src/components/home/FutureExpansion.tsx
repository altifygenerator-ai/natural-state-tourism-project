const items = [
  "Keep the five current town guides fresh and useful",
  "Strengthen lodging, food, event, and outdoor coverage",
  "Build deeper visitor-focused local business pages",
  "Connect nearby towns into useful regional trip planning",
  "Grow partnerships only where they fit the guides",
  "Use community suggestions to find missing local stops",
];

export default function FutureExpansion() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">What We’re Building Next</p>

          <h2 className="section-title">
            Stronger local guides first, wider expansion second.
          </h2>

          <p className="section-lead">
            Hot Springs, Glenwood, Mount Ida, Amity, and Murfreesboro are all
            live. The current priority is keeping those guides accurate,
            expanding the useful local detail inside them, and connecting the
            region better before adding a long list of new towns.
          </p>
        </div>

        <div className="future-grid">
          {items.map((item) => (
            <div key={item} className="future-card">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
