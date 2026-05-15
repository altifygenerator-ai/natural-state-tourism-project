"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Sending...");

    const formData = new FormData(event.currentTarget);

    const res = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify({
        formType: "business",
        name: formData.get("name"),
        business: formData.get("business"),
        email: formData.get("email"),
        website: formData.get("website"),
        inquiryType: formData.get("inquiryType"),
        message: formData.get("message"),
      }),
    });

    setStatus(res.ok ? "Message sent." : "Something went wrong.");
    if (res.ok) event.currentTarget.reset();
  }

  return (
    <section className="section-white">
      <div className="container-grid contact-grid">
        <div>
          <p className="eyebrow">Business Inquiries</p>
          <h2 className="section-title">
            Featured placement and partnership inquiries.
          </h2>
          <p className="section-lead">
            Reach out regarding featured placement opportunities, dedicated
            business pages, tourism partnerships, or future regional sponsorships.
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" required />
            </div>

            <div className="form-field">
              <label htmlFor="business">Business Name</label>
              <input id="business" name="business" type="text" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>

            <div className="form-field">
              <label htmlFor="website">Website / Facebook</label>
              <input id="website" name="website" type="text" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="inquiryType">Inquiry Type</label>
            <select id="inquiryType" name="inquiryType">
              <option>Featured Placement</option>
              <option>Dedicated Business Page</option>
              <option>Regional Partnership</option>
              <option>General Business Inquiry</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={6} required />
          </div>

          <button type="submit" className="btn-dark">Send Inquiry</button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </section>
  );
}