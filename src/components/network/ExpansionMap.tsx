const items = [
  "Hot Springs remains the largest guide and needs frequent event, attraction, lodging, restaurant, and local-business maintenance.",
  "Glenwood and Mount Ida are the outdoor-travel anchors of the current network, with the Caddo River, Lake Ouachita, cabins, food, and recreation driving most of their useful coverage.",
  "Amity stays intentionally smaller and community-focused, with room for local history, nearby discovery, businesses, and small-town travel ideas.",
  "Murfreesboro is active around Crater of Diamonds, Lake Greeson, lodging, food, family travel, and high-intent visitor planning.",
  "The five guides should link together where a real trip naturally crosses town lines instead of forcing visitors into isolated destination pages.",
  "New town guides can be added when there is enough local depth to keep them useful and maintained; statewide expansion is a long-term direction, not a fixed rollout schedule.",
];

export default function ExpansionMap() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Network Direction</p>

          <h2 className="section-title">
            Maintain what is live, connect the region, then expand carefully.
          </h2>

          <p className="section-lead">
            The project works better when each local guide earns its place with
            useful visitor information instead of expanding just to make the
            network look bigger.
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
