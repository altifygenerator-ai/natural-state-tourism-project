// src/components/layout/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/about", label: "About" },
  { href: "/network", label: "Our Network" },
  { href: "/advertising", label: "Advertising" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
      <div className="site-header-inner">
        <Link href="/" className="site-logo-link">
          <Image
            src="/images/logo.png"
            alt="Natural State Tourism Project logo"
            width={44}
            height={44}
            priority
            className="site-logo"
          />
          <span className="site-logo-text">Natural State Tourism Project</span>
        </Link>

        <nav className="site-nav">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="site-nav-link">
              {link.label}
            </Link>
          ))}

          <Link href="/advertising" className="site-nav-cta">
            Featured Placement
          </Link>
        </nav>
      </div>
    </header>
  );
}