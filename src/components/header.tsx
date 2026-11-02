"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useBooking } from "@/components/booking-provider";
import { integrations } from "@/config/integrations";

const navItems = [
  { label: "Agent Quest", href: "#quest" },
  { label: "Agents", href: "#platform" },
  { label: "Planner", href: "#live-agent" },
  { label: "Security", href: "#security" },
  { label: "Training", href: "#live-program" },
  { label: "Team", href: "#team" },
] as const;

export function Header() {
  const { openBooking } = useBooking();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  return (
    <header className="site-header" data-scrolled={scrolled || menuOpen}>
      <div className="site-header-inner">
        <a href="#top" aria-label="Akrithos home" className="site-logo">
          <Image src="/akrithos-logo-full-night.png" alt="Akrithos: precision at speed" width={964} height={394} priority />
        </a>

        <nav aria-label="Primary navigation" className="site-nav">
          {navItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
        </nav>

        <div className="site-header-actions">
          <a href={integrations.portalUrl} className="site-login">Member Login</a>
          <button type="button" className="button button-primary button-small" onClick={openBooking}>Book your Diagnostic</button>
        </div>

        <button type="button" className="site-menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen ? (
        <nav id="mobile-menu" aria-label="Mobile navigation" className="site-mobile-nav">
          {navItems.map((item) => <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <a href={integrations.portalUrl} onClick={() => setMenuOpen(false)}>Member Login</a>
          <button type="button" className="button button-primary" onClick={() => { setMenuOpen(false); openBooking(); }}>Book your Diagnostic</button>
        </nav>
      ) : null}
    </header>
  );
}
