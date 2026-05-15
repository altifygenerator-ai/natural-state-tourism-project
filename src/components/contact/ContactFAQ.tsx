// src/components/contact/ContactFAQ.tsx
const faq = [
  {
    title: "Is this affiliated with Arkansas tourism?",
    text: "No. Natural State Tourism Project is privately owned and independently operated.",
  },
  {
    title: "Can businesses request featured placement?",
    text: "Yes. Businesses can reach out regarding featured placement opportunities and dedicated pages.",
  },
  {
    title: "Can locals submit recommendations?",
    text: "Absolutely. Community suggestions help improve the guides and support local discovery.",
  },
  {
    title: "Will more towns be added?",
    text: "Yes. The long-term goal is gradual expansion into additional Arkansas regions over time.",
  },
];

export default function ContactFAQ() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>

          <h2 className="section-title">
            Common questions about the project.
          </h2>
        </div>

        <div className="future-grid">
          {faq.map((item) => (
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