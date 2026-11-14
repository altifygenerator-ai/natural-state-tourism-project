const priorities = [
  "Reliable events and local dates",
  "Useful restaurants, shops and places to stay",
  "Better connections between nearby towns",
];

export default function FutureExpansion() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Our Focus</p>
          <h2 className="section-title">
            Better local guides, one town at a time.
          </h2>
          <p className="section-lead">
            We're focused on Hot Springs, Glenwood, Mount Ida, Murfreesboro and
            Amity. Good local details matter more than adding dozens of towns
            before we're ready to do them justice.
          </p>
        </div>
        <div className="future-grid">
          {priorities.map((priority) => (
            <div key={priority} className="future-card">{priority}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
