import React from "react";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Top Section */}
      <div className="footer-top">
        <div className="footer-col footer-brand">
          <h3 className="footer-logo">Jhapcham</h3>
          <p className="footer-about">
            Jhapcham is your everyday shopping partner in Nepal. Discover
            mobiles, gadgets, fashion and daily essentials with fast delivery
            and trusted support.
          </p>
          <p className="footer-contact">
            Need help? <br />
            <span>📞 +977-9800000000</span> <br />
            <span>✉ support@jhapcham.com</span>
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/shop">Shop</a></li>
            <li><a href="/about">About us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Customer Service</h4>
          <ul className="footer-links">
            <li><a href="/faq">FAQs</a></li>
            <li><a href="/returns">Return policy</a></li>
            <li><a href="/shipping">Shipping info</a></li>
            <li><a href="/privacy">Privacy policy</a></li>
          </ul>
        </div>

        <div className="footer-col footer-news-social">
          <h4 className="footer-heading">Stay updated</h4>
          <p className="footer-news-text">
            Get deals, new arrivals and app-only offers.
          </p>
          <form
            className="footer-news-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              className="footer-input"
              placeholder="Enter your email"
            />
            <button className="footer-btn" type="submit">
              Subscribe
            </button>
          </form>

          <h4 className="footer-heading footer-social-title">Follow us</h4>
          <div className="footer-social">
            <a href="https://facebook.com" aria-label="Facebook">📘</a>
            <a href="https://instagram.com" aria-label="Instagram">📸</a>
            <a href="https://twitter.com" aria-label="Twitter / X">🐦</a>
            <a href="https://youtube.com" aria-label="YouTube">▶️</a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="footer-bottom">
        <p>
          © {year} <strong>Jhapcham</strong>. All rights reserved.
        </p>
        <p className="footer-made">
          Made with  in Nepal
        </p>
      </div>
    </footer>
  );
}

export default Footer;
