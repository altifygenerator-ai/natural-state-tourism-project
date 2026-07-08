// src/components/advertising/PlacementTypes.tsx
const items = [
  {
    title: "Featured Placement Cards",
    text: "Larger highlighted placements throughout tourism guide pages with stronger visibility and imagery.",
  },
  {
    title: "Business Spotlight Pages",
    text: "Featured partners can receive a dedicated visitor-facing spotlight page inside the tourism guide network.",
  },
  {
    title: "Category Visibility",
    text: "Stronger placement within lodging, restaurants, attractions, shopping, and tourism categories.",
  },
  {
    title: "Direct Traffic & Discovery",
    text: "Help travelers discover businesses while actively planning trips and exploring Arkansas towns.",
  },
  {
    title: "Future Network Growth",
    text: "Featured businesses may benefit from future network expansion as more Arkansas regions are added.",
  },
  {
    title: "Locally Focused Partnerships",
    text: "Partnerships are focused on Arkansas businesses connected to tourism, local discovery, and useful visitor planning.",
  },
];

export default function PlacementTypes() {
  return (
    <section className="section-white">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Placement Options</p>

          <h2 className="section-title">
            Multiple ways for businesses to stand out.
          </h2>
        </div>

        <div className="future-grid">
          {items.map((item) => (
            <div key={item.title} className="future-card">
              <h3 className="card-title">{item.title}</h3>

              <p className="card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}