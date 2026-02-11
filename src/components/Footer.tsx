import React from 'react';
import './Footer.css';
import mlabLogo from '../assets/mlab-logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <p className="footer-copyright">
          &copy; {currentYear} mLab. All rights reserved.
        </p>
        <a href="/dashboard">
          <img src={mlabLogo} alt="mLab Logo" className="footer-logo" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;