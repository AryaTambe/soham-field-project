'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" href="/">
          <img alt="Soham Surgical logo" src="/assets/soham-logo.png" />
          <span>
            <strong>SOHAM</strong>
            <small>SURGICAL</small>
          </span>
        </Link>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <a href="/#products" onClick={() => setIsMenuOpen(false)}>Equipment</a>
          <a href="/#services" onClick={() => setIsMenuOpen(false)}>Services</a>
          <a href="/#about" onClick={() => setIsMenuOpen(false)}>About</a>
          <a href="/#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
        </nav>
        <a className="nav-cta" href="/#contact">Get in touch</a>
        <button
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          className="menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          type="button"
        >
          ☰
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="container footer-top">
          <Link className="brand brand-footer" href="/">
            <img alt="Soham Surgical logo" src="/assets/soham-logo.png" />
            <span>
              <strong>SOHAM</strong>
              <small>SURGICAL</small>
            </span>
          </Link>
          <p>Manufacturer Sales &amp; Services of Physiotherapy Equipments</p>
          <a href="tel:+919821875579">+91 98218 75579</a>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Soham Surgical. All rights reserved.</span>
          <span>
            1B / 002, Saicharan Co-op. Soc. Ltd, N. S. Phadke Rd, Saiwadi,
            Andheri (E), Mumbai - 400 069.
          </span>
        </div>
      </footer>
      <a
        aria-label="WhatsApp Soham Surgical"
        className="whatsapp"
        href="https://wa.me/919821875579"
        rel="noreferrer"
        target="_blank"
      >
        ✆
      </a>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
