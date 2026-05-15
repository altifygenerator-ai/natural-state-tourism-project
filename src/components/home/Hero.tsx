// src/components/home/Hero.tsx
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-[var(--forest)] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55"
        style={{ backgroundImage: "url('/images/arkansas-hero.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-[var(--forest)]/45 to-[var(--forest)]/85" />

      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 py-28 md:px-10">
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-[var(--gold)]">
          Independent Arkansas Tourism Guide Network
        </p>

        <h1 className="max-w-5xl text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
          Natural State Tourism Project
        </h1>

        <p className="mt-7 max-w-3xl text-lg leading-8 text-white/80 md:text-xl">
          Helping travelers discover Arkansas while giving local businesses
          stronger online visibility across the state.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/network" className="btn-gold">
            Explore Our Network
          </Link>

          <Link href="/advertising" className="btn-outline-light">
            Advertising & Featured Placement
          </Link>
        </div>
      </div>
    </section>
  );
}