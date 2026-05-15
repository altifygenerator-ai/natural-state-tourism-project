// src/components/home/TrustStrip.tsx
const items = [
  "Independent Arkansas-Based Network",
  "Built For Local Discovery",
  "Supporting Small Businesses",
  "Featured Placements Available",
];

export default function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="trust-strip-grid">
        {items.map((item) => (
          <div key={item} className="trust-strip-item">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}