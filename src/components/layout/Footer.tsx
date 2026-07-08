// src/components/layout/Footer.tsx
import Link from "next/link";

const networkLinks = [
  {
    name: "Hot Springs",
    href: "https://hotspringsarkansas.org",
  },
  {
    name: "Glenwood",
    href: "https://glenwoodarkansas.org",
  },
  {
    name: "Mount Ida",
    href: "https://mountidaarkansas.org",
  },
  {
    name: "Amity",
    href: "https://amityarkansas.org",
  },
  {
    name: "Murfreesboro",
    href: "https://murfreesboroarkansas.org",
  },
];

const companyLinks = [
  {
    name: "About",
    href: "/about",
  },
  {
    name: "Advertising",
    href: "/advertising",
  },
  {
    name: "Contact",
    href: "/contact",
  },
];

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-[var(--forest-dark)] text-white">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 md:grid-cols-[1.2fr_0.7fr_0.7fr] md:px-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--gold)]">
            Natural State Tourism Project
          </p>

          <h2 className="mt-5 max-w-lg text-4xl font-black tracking-tight">
            Independent Arkansas tourism guide network.
          </h2>

          <p className="mt-6 max-w-xl leading-8 text-white/70">
            Helping travelers discover Arkansas while giving local businesses
            stronger visibility through modern tourism-focused local guides.
          </p>

          <p className="mt-6 text-sm leading-7 text-white/45">
            Natural State Tourism Project is privately owned and is not
            affiliated with the State of Arkansas or any government tourism
            organization.
          </p>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--gold)]">
            Network
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {networkLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 transition hover:text-[var(--gold)]"
              >
                {link.name} Arkansas Guide
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--gold)]">
            Company
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {companyLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-white/70 transition hover:text-[var(--gold)]"
              >
                {link.name}
              </Link>
            ))}

            <a
              href="mailto:naturalstatetourismproject@gmail.com"
              className="text-white/70 transition hover:text-[var(--gold)]"
            >
              naturalstatetourismproject@gmail.com
            </a>
          </div>
        </div>
      </div>

   <div className="border-t border-white/10">
  <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-white/45 md:flex-row md:items-center md:justify-between md:px-10">
    <p>
      © {new Date().getFullYear()} Natural State Tourism Project. All
      rights reserved.
    </p>

    <p>
      Built to support Arkansas towns, tourism, and local businesses.
    </p>

    <a
      href="https://hometownwebservicesar.com"
      target="_blank"
      rel="noopener noreferrer"
      className="transition hover:text-white"
    >
      Built by Hometown Web Services
    </a>
  </div>
</div>
    </footer>
  );
}