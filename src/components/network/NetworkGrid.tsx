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
            Active and planned Arkansas guide sites.
          </h2>

          <p className="section-lead">
            The network is starting with focused regional coverage and will
            continue expanding as the guides are filled out.
          </p>
        </div>

        <div className="network-grid network-grid-spaced">
          {networkSites.map((site) => {
            const isComingSoon = site.href === "#";

            return (
              <Link
                key={site.name}
                href={site.href}
                target={isComingSoon ? undefined : "_blank"}
                className="network-card"
              >
                <div className="network-image-wrap">
                  {isComingSoon ? (
                    <div className="coming-soon-card">
                      <p className="card-eyebrow">Coming Soon</p>
                      <h3 className="coming-soon-title">{site.name}</h3>
                      <p className="coming-soon-text">
                        Future coverage for Crater of Diamonds, lodging, food,
                        shops, and local things to do.
                      </p>
                    </div>
                  ) : (
                    <Image
                      src={site.image}
                      alt={site.name}
                      fill
                      className="network-image"
                    />
                  )}
                </div>

                <div className="network-card-content">
                  <p className="card-eyebrow">{site.status}</p>

                  <h3 className="card-title">{site.name}</h3>

                  <p className="card-text">{site.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}