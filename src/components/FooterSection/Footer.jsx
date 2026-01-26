import React from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight
} from 'lucide-react';
import './Footer.css';
import logo from "../Images/Logo/logo1.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <img src={logo} alt="Jhapcham Logo" className="footer-logo-img" />
              <p className="footer-desc">
                Your one-stop destination for premium electronics, fashion, and home decor. 
                Experience seamless shopping with ultra-fast delivery.
              </p>
              <div className="footer-socials">
                <a href="#" className="social-link"><Facebook size={20} /></a>
                <a href="#" className="social-link"><Twitter size={20} /></a>
                <a href="#" className="social-link"><Instagram size={20} /></a>
                <a href="#" className="social-link"><Youtube size={20} /></a>
              </div>
            </div>

            {/* Links Sections */}
            <div className="footer-links">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/products">Shop All</a></li>
                <li><a href="/new-arrivals">New Arrivals</a></li>
                <li><a href="/offers">Exclusive Offers</a></li>
                <li><a href="/sellers">Top Sellers</a></li>
              </ul>
            </div>

            <div className="footer-links">
              <h3>Support</h3>
              <ul>
                <li><a href="/help">Help Center</a></li>
                <li><a href="/shipping">Shipping Info</a></li>
                <li><a href="/returns">Returns & Refunds</a></li>
                <li><a href="/contact">Contact Us</a></li>
              </ul>
            </div>

            {/* Newsletter Section */}
            <div className="footer-newsletter">
              <h3>Newsletter</h3>
              <p>Subscribe to get special offers and once-in-a-lifetime deals.</p>
              <form className="newsletter-form">
                <input type="email" placeholder="Your email address" required />
                <button type="submit">
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-contact-bar">
        <div className="footer-container bar-content">
          <div className="contact-item">
            <Phone size={18} />
            <span>+977-9800000000</span>
          </div>
          <div className="contact-item">
            <Mail size={18} />
            <span>support@jhapcham.com</span>
          </div>
          <div className="contact-item">
            <MapPin size={18} />
            <span>Kathmandu, Nepal</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container bottom-flex">
          <p>© 2025 Jhapcham E-commerce. All rights reserved.</p>
          <div className="footer-policies">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
