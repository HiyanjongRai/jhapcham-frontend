import React from 'react';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  ChevronUp
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer-ribbon">
        <span>Get in touch</span>
      </div>
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-grid">
            
            {/* Left Column: Contact Info */}
            <div className="footer-col-contact">
              <h3>CONTACT INFO</h3>
              <ul className="contact-list">
                <li>
                  <strong>ADDRESS:</strong>
                  <span>Kathmandu, Nepal</span>
                </li>
                <li>
                  <strong>PHONE:</strong>
                  <span>(+977) 980-0000000</span>
                </li>
                <li>
                  <strong>EMAIL:</strong>
                  <span>support@jhapcham.com.np</span>
                </li>
                <li>
                  <strong>WORKING DAYS/HOURS:</strong>
                  <span>Sun - Fri / 9:00 AM - 8:00 PM</span>
                </li>
              </ul>
              <div className="footer-socials">
                <a href="#" className="social-link" aria-label="Facebook"><Facebook size={16} fill="white" strokeWidth={0}/></a>
                <a href="#" className="social-link" aria-label="Twitter"><Twitter size={16} fill="white" strokeWidth={0}/></a>
                <a href="#" className="social-link" aria-label="LinkedIn"><Linkedin size={16} fill="white" strokeWidth={0}/></a>
              </div>
            </div>

            {/* Right Area: Newsletter + Links */}
            <div className="footer-col-main">
              
              <div className="footer-newsletter-row">
                <div className="newsletter-text">
                  <h3>SUBSCRIBE NEWSLETTER</h3>
                  <p>Get all the latest information on Events, Sales and Offers.<br/>Sign up for newsletter today.</p>
                </div>
                <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="Email Address" required />
                  <button type="submit">SUBSCRIBE</button>
                </form>
              </div>

              <div className="footer-links-row">
                <div className="footer-links-col">
                  <h3>CUSTOMER SERVICE</h3>
                  <div className="links-two-col">
                    <ul className="links-list">
                      <li><a href="/about">About us</a></li>
                      <li><a href="/contact">Contact us</a></li>
                      <li><a href="/account">My account</a></li>
                    </ul>
                    <ul className="links-list">
                      <li><a href="/orders">Order history</a></li>
                      <li><a href="/search">Advanced search</a></li>
                      <li><a href="/login">Login</a></li>
                    </ul>
                  </div>
                </div>

                <div className="footer-links-col">
                  <h3>ABOUT US</h3>
                  <div className="links-two-col">
                    <ul className="links-list">
                      <li><a href="#">Delivery across Nepal</a></li>
                      <li><a href="#">Local Payment Options</a></li>
                      <li><a href="#">Trusted E-commerce Platform</a></li>
                    </ul>
                    <ul className="links-list">
                      <li><a href="#">Fast User Support</a></li>
                      <li><a href="#">Secure Shopping</a></li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container bottom-flex">
          <p>© Jhapcham eCommerce. 2026. All Rights Reserved</p>
          <div className="footer-payments">
            <span className="pay-icon font-esewa">eSewa</span>
          </div>
        </div>
      </div>

      <div className="scroll-to-top" onClick={scrollToTop} aria-label="Scroll to top">
        <ChevronUp size={24} />
      </div>
    </footer>
  );
};

export default Footer;
