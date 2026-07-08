const pricing = [
  {
    title: "Basic Business Listing",
    price: "Free when it fits the guide",
    text: "A simple listing for local businesses, stays, restaurants, attractions, and shops that make sense for one of the current Arkansas guides.",
  },
  {
    title: "Featured Placement",
    price: "$20/month",
    text: "Higher visibility inside the matching local guide, with stronger placement in the category where visitors are already looking.",
  },
  {
    title: "Business Spotlight Page",
    price: "$100 one time",
    text: "A dedicated spotlight page with a fuller write-up, photos, direct links, visitor-focused details, and a Natural State social post.",
  },
];

export default function PricingSection() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Pricing & Partnerships</p>

          <h2 className="section-title">
            Simple options for local businesses.
          </h2>

          <p className="section-lead">
            Featured placement and spotlight pages are built to fit naturally
            inside the guides while helping visitors find useful local places.
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
