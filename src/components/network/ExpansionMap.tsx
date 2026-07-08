// src/components/network/ExpansionMap.tsx
const items = [
  "Hot Springs is the flagship guide and will continue growing into the largest current coverage area.",
  "Glenwood and Mount Ida will keep getting stronger lodging, food, outdoor, and local business coverage.",
  "Amity will stay smaller but can grow around niche local ideas, community history, and nearby discovery.",
  "Murfreesboro is now live with coverage around Crater of Diamonds, Lake Greeson, lodging, food, and family travel.",
  "Expand outward to complete stronger regional coverage across Central Arkansas before moving into wider statewide expansion.",
  "Long term, the vision is to eventually connect tourism guides across all major Arkansas regions, with Little Rock becoming one of the final major pieces of the network.",
];

export default function ExpansionMap() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Expansion Path</p>

          <h2 className="section-title">
            Focused growth before spreading too wide.
          </h2>

          <p className="section-lead">
            The goal is to make each guide feel useful and real before adding
            too many new towns.
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
