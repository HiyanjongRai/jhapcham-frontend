import React from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const role = localStorage.getItem("userRole");

  return (
    <footer className="footer">

      {/* ─── Newsletter Strip ─── */}
      <div className="footer-newsletter-strip">
        <div className="footer-container">
          <div className="footer-newsletter-inner">
            <div className="footer-newsletter-text">
              <h3>Stay in the Loop</h3>
              <p>Subscribe to get the latest deals, new arrivals & exclusive offers.</p>
            </div>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email address" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Footer Main ─── */}
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">

            {/* Brand Column */}
            <div className="footer-brand-col">
              <div className="footer-brand-logo">
                Jhap<span>cham</span>
              </div>
              <p className="footer-brand-desc">
                Nepal's trusted online shopping destination. Discover thousands of products from verified sellers — delivered fast and securely across Nepal.
              </p>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="#" className="social-link" aria-label="Twitter">
                  <Twitter size={16} />
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <Linkedin size={16} />
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="footer-col-contact">
              <h3>Contact Us</h3>
              <ul className="contact-list">
                <li>
                  <strong>Address</strong>
                  <span>Kathmandu, Nepal</span>
                </li>
                <li>
                  <strong>Phone</strong>
                  <span>(+977) 980-0000000</span>
                </li>
                <li>
                  <strong>Email</strong>
                  <span>support@jhapcham.com.np</span>
                </li>
                <li>
                  <strong>Hours</strong>
                  <span>Sun – Fri, 9:00 AM – 8:00 PM</span>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="footer-links-col">
              <h3>Customer Service</h3>
              <ul className="links-list">
                <li><Link to="/contact">About Us</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to={role === "ADMIN" ? "/admin/dashboard" : role === "SELLER" ? "/seller/dashboard" : "/customer/dashboard"}>My Account</Link></li>
                <li><Link to={role === "ADMIN" ? "/admin/dashboard" : role === "SELLER" ? "/seller/dashboard" : "/customer/dashboard"}>Order History</Link></li>
                <li><Link to="/wishlist">My Wishlist</Link></li>
                <li><Link to="/login">Sign In</Link></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="footer-links-col">
              <h3>Quick Links</h3>
              <ul className="links-list">
                <li><Link to="/new-arrivals">New Arrivals</Link></li>
                <li><Link to="/on-sale">On Sale</Link></li>
                <li><Link to="/campaigns">Campaigns</Link></li>
                <li><Link to="/products">All Products</Link></li>
                <li><Link to="/seller/register">Become a Seller</Link></li>
                <li><Link to="/contact">Help & FAQ</Link></li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* ─── Footer Bottom ─── */}
      <div className="footer-bottom">
        <div className="footer-container bottom-flex">
          <p>© {new Date().getFullYear()} Jhapcham eCommerce. All Rights Reserved.</p>
          <div className="footer-payments">
            <span className="pay-icon font-esewa">eSewa</span>
          </div>
        </div>
      </div>

      {/* ─── Scroll to Top ─── */}
      <div className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
        <ChevronUp size={20} />
      </div>

    </footer>
  );
};

export default Footer;
