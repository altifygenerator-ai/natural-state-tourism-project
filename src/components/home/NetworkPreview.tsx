// src/components/home/NetworkPreview.tsx
import Link from "next/link";
import Image from "next/image";
import { networkSites } from "@/data/network";

export default function NetworkPreview() {
  return (
    <section className="section-white">
      <div className="container">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Our Network</p>

            <h2 className="section-title">
              Arkansas town guides built to grow over time.
            </h2>
          </div>

          <Link href="/network" className="btn-outline-dark">
            View All Guides
          </Link>
        </div>

        <div className="network-grid">
          {networkSites.slice(0, 4).map((site) => (
            <Link
              key={site.name}
              href={site.href}
              target="_blank"
              className="network-card"
            >
              <div className="network-image-wrap">
                <Image
                  src={site.image}
                  alt={site.name}
                  fill
                  className="network-image"
                />
              </div>

              <div className="network-card-content">
                <p className="card-eyebrow">{site.status}</p>

                <h3 className="card-title">
                  {site.name}
                </h3>

                <p className="card-text">
                  {site.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}