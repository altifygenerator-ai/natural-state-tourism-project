// src/components/contact/ContactMethods.tsx
export default function ContactMethods() {
  return (
    <section className="section-paper">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Contact Information</p>

          <h2 className="section-title">
            Reach the project directly.
          </h2>

          <p className="section-lead">
            Business inquiries, featured placement discussions, partnerships,
            or general questions about the network.
          </p>
        </div>

        <div className="contact-methods-grid">
          <a
            href="mailto:contact@naturalstatetourismproject.com"
            className="contact-method-card"
          >
            <p className="card-eyebrow">General Contact</p>

            <h3 className="card-title">
              naturalstatetourismproject@gmail.com
            </h3>

            <p className="card-text">
              General questions, project inquiries, or partnership discussions.
            </p>
          </a>

          <a
            href="mailto:advertising@naturalstatetourismproject.com"
            className="contact-method-card"
          >
            <p className="card-eyebrow">Advertising</p>

            <h3 className="card-title">
              naturalstatetourismproject@gmail.com
            </h3>

            <p className="card-text">
              Featured placement opportunities, dedicated business pages, and
              future sponsorship discussions.
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}