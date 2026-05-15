"use client";

import { useState } from "react";

const suggestions = [
  "Restaurants & Coffee Shops",
  "Cabins, Hotels & Lodging",
  "Outdoor Recreation",
  "Local Events & Festivals",
  "Hidden Gems",
  "Businesses Worth Featuring",
];

export default function SuggestionSection() {
  const [status, setStatus] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("Sending...");

    const formData = new FormData(event.currentTarget);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formType: "suggestion",
        name: formData.get("name"),
        email: formData.get("email"),
        location: formData.get("location"),
        suggestionType: formData.get("suggestionType"),
        message: formData.get("message"),
      }),
    });

    if (res.ok) {
      setStatus("Suggestion sent.");
      event.currentTarget.reset();
    } else {
      setStatus("Something went wrong.");
    }
  }

  return (
    <section className="section-paper">
      <div className="container-grid contact-grid">
        <div>
          <p className="eyebrow">Community Suggestions</p>

          <h2 className="section-title">
            Help improve the Arkansas guides.
          </h2>

          <p className="section-lead">
            Local suggestions help make the network stronger, more accurate,
            and more useful for visitors exploring Arkansas.
          </p>

          <div className="suggestion-tags">
            {suggestions.map((item) => (
              <div key={item} className="suggestion-tag">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="name">Name</label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@email.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="location">Town / Area</label>

              <input
                id="location"
                name="location"
                type="text"
                placeholder="Hot Springs, Glenwood, etc."
              />
            </div>

            <div className="form-field">
              <label htmlFor="suggestionType">
                Suggestion Type
              </label>

              <select
                id="suggestionType"
                name="suggestionType"
              >
                <option>Restaurant</option>
                <option>Lodging</option>
                <option>Outdoor Recreation</option>
                <option>Business Recommendation</option>
                <option>Correction / Update</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="message">Suggestion</label>

            <textarea
              id="message"
              name="message"
              rows={6}
              placeholder="Tell us what we should add, update, or check out..."
              required
            />
          </div>

          <button type="submit" className="btn-dark">
            Send Suggestion
          </button>

          {status && (
            <p className="form-status">
              {status}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}