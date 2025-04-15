import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p>© 2024 Restaurant Booking Platform</p>
        <nav>
          <a href="/about">About</a>
          <a href="/privacy">Privacy</a>
          <a href="/help">Help</a>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
