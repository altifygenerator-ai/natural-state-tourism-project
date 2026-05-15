// src/components/home/FutureExpansion.tsx
const items = [
  "More Arkansas town guides",
  "Expanded lodging coverage",
  "Featured business pages",
  "Regional travel resources",
  "Tourism partnerships",
  "Community suggestions",
];

export default function FutureExpansion() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Future Expansion</p>

          <h2 className="section-title">
            Built to grow into a wider Arkansas tourism network.
          </h2>

          <p className="section-lead">
            The goal is to continue expanding coverage across Arkansas with
            modern, useful, community-focused tourism guides.
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