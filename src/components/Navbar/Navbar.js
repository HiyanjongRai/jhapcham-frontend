import React, { useState, useRef } from "react";
import "./Navbar.css";

const links = ["Shop", "On Sale", "New Arrivals", "Brands"];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({});
  const linksRef = useRef([]);

  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleMouseEnter = (index) => {
    const link = linksRef.current[index];
    setUnderlineStyle({
      width: `${link.offsetWidth}px`,
      left: `${link.offsetLeft}px`,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    setUnderlineStyle({ ...underlineStyle, opacity: 0 });
  };

  return (
    <>
      <header className="nav">
        {/* Left Section */}
        <div className="nav-left">
          <div className="nav-logo">JHAPCHAM</div>

          {/* Desktop Links */}
          <nav className="nav-links" onMouseLeave={handleMouseLeave}>
            {links.map((text, index) => (
              <button
                key={index}
                ref={(el) => (linksRef.current[index] = el)}
                className="nav-link"
                onMouseEnter={() => handleMouseEnter(index)}
              >
                {text}
              </button>
            ))}
            <span className="nav-underline" style={underlineStyle}></span>
          </nav>
        </div>

        {/* Desktop Search */}
        <div className="nav-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search for products..."
          />
        </div>

        {/* Right Section */}
        <div className="nav-right">
          <button className="seller-btn">Become Seller</button>
          <button className="icon-btn">🛒</button>
          <button className="icon-btn">👤</button>

          {/* Mobile Hamburger */}
          <button
            className="nav-mobile-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <div className="mobile-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search for products..."
            />
          </div>

          <nav className="mobile-links">
            {links.map((text, index) => (
              <button key={index} className="mobile-link">
                {text}
              </button>
            ))}
          </nav>

          <button className="mobile-seller-btn">Become Seller</button>
        </div>
      )}
    </>
  );
};

export default Navbar;
