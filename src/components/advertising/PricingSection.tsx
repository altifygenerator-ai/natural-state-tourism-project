// src/components/advertising/PricingSection.tsx
const pricing = [
  {
    title: "Standard Featured Placement",
    price: "Starting around $50-$150",
    text: "Featured visibility placement inside local tourism guide pages depending on category and location.",
  },
  {
    title: "Dedicated Business Pages",
    price: "Custom Pricing",
    text: "Full internal spotlight pages with photos, information, direct links, and expanded business coverage.",
  },
  {
    title: "Future Regional Sponsorships",
    price: "Planned Expansion",
    text: "Larger future sponsorship opportunities tied to regional growth and expanded tourism coverage.",
  },
];

export default function PricingSection() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Pricing & Partnerships</p>

          <h2 className="section-title">
            Flexible options while the network grows.
          </h2>

          <p className="section-lead">
            Pricing may vary depending on placement type, guide size, category,
            and future expansion opportunities.
          </p>
        </div>

        <div className="future-grid">
          {pricing.map((item) => (
            <div key={item.title} className="future-card">
              <p className="card-eyebrow">{item.price}</p>

              <h3 className="card-title">{item.title}</h3>

              <p className="card-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}