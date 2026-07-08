// src/components/network/NetworkGrid.tsx
import Image from "next/image";
import Link from "next/link";
import { networkSites } from "@/data/network";

export default function NetworkGrid() {
  return (
    <section className="section-white">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">Current Guides</p>

          <h2 className="section-title">
            Active Arkansas guide sites.
          </h2>

          <p className="section-lead">
            The network is growing through focused regional coverage with guides
            built around real Arkansas towns, local stops, and visitor planning.
          </p>
        </div>

        <div className="network-grid network-grid-spaced">
          {networkSites.map((site) => (
            <Link
              key={site.name}
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
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

                <h3 className="card-title">{site.name}</h3>

                <p className="card-text">{site.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
