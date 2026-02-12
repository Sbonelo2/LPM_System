import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

// Type declaration for Google Analytics
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: Record<string, any>) => void;
  }
}

const sections = [
  "Home", 
  "About", 
  "Features", 
  "Gallery",
  "QCTO Compliance", 
  "Stakeholders", 
  "FAQ", 
  "Contact"
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [cookieConsent, setCookieConsent] = useState({ analytics: false, marketing: false });
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Check for cookie consent on mount
  useEffect(() => {
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      setShowCookieConsent(true);
    } else {
      setCookieConsent(JSON.parse(hasConsent));
    }
  }, []);

  /* ===== Scroll Progress + Active Slide Detection ===== */
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollLeft = containerRef.current.scrollLeft;
      const width = window.innerWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);

      const maxScroll = containerRef.current.scrollWidth - width;
      const progress = (scrollLeft / maxScroll) * 100;

      const bar = document.getElementById("progress-bar");
      if (bar) bar.style.width = `${progress}%`;
    };

    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  /* ===== Keyboard Navigation ===== */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowLeft':
          scrollToSection(activeIndex - 1);
          break;
        case 'ArrowRight':
          scrollToSection(activeIndex + 1);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  /* ===== Touch/Swipe Support ===== */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touchStartX = e.touches[0].clientX;
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          scrollToSection(activeIndex + 1);
        } else {
          scrollToSection(activeIndex - 1);
        }
      }
      window.removeEventListener('touchend', handleTouchEnd);
    };
    
    window.addEventListener('touchend', handleTouchEnd);
  }, [activeIndex]);

  /* ===== Scroll to Section with Wrap-Around ===== */
  const scrollToSection = (index: number) => {
    const total = sections.length;
    let newIndex = index;

    if (index < 0) newIndex = total - 1;
    if (index >= total) newIndex = 0;

    containerRef.current?.scrollTo({
      left: newIndex * window.innerWidth,
      behavior: "smooth",
    });
  };

  /* ===== Fullscreen Toggle ===== */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  /* ===== Cookie Consent Handlers ===== */
  const handleCookieConsent = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookieConsent));
    setShowCookieConsent(false);
    
    // Analytics integration based on consent
    if (cookieConsent.analytics && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID');
    }
  };

  const updateConsent = (type: 'analytics' | 'marketing', value: boolean) => {
    setCookieConsent(prev => ({ ...prev, [type]: value }));
  };

  /* ===== Form Handlers ===== */
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    // Analytics integration
    if (window.gtag && cookieConsent.analytics) {
      window.gtag('event', 'contact_form_submit', {
        'event_category': 'engagement',
        'event_label': 'contact'
      });
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', newsletterEmail);
    // Analytics integration
    if (window.gtag && cookieConsent.analytics) {
      window.gtag('event', 'newsletter_signup', {
        'event_category': 'engagement',
        'event_label': 'newsletter'
      });
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const shareOnSocial = (platform: string) => {
    const url = window.location.href;
    const text = "Check out LPM System - Learner Placement & Workplace Host Management System aligned with QCTO and SETA requirements";
    
    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open('https://www.linkedin.com/company/mlab-sa', '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
    }
    
    // Track social share event
    if (window.gtag && cookieConsent.analytics) {
      window.gtag('event', 'share', {
        method: platform,
        content_type: 'landing_page'
      });
    }
  };

  // Platform screenshots data
  const screenshots = [
    { id: 1, title: "Placement Dashboard", description: "QCTO-aligned placement tracking and monitoring" },
    { id: 2, title: "Document Management", description: "SETA-compliant document storage and verification" },
    { id: 3, title: "Compliance Monitoring", description: "Real-time compliance status and alerts" },
    { id: 4, title: "Stakeholder Portal", description: "Multi-stakeholder collaboration interface" },
    { id: 5, title: "Reporting Analytics", description: "Comprehensive reporting for QCTO requirements" },
    { id: 6, title: "Workplace Host Management", description: "Centralized workplace host coordination" }
  ];

  return (
    <>
      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="cookie-consent-banner">
          <div className="cookie-content">
            <h4>🍪 Cookie Consent</h4>
            <p>We use cookies to enhance your experience and analyze site traffic in compliance with POPIA.</p>
            <div className="cookie-options">
              <label className="cookie-option">
                <input
                  type="checkbox"
                  checked={cookieConsent.analytics}
                  onChange={(e) => updateConsent('analytics', e.target.checked)}
                />
                <span>Analytics (essential)</span>
              </label>
              <label className="cookie-option">
                <input
                  type="checkbox"
                  checked={cookieConsent.marketing}
                  onChange={(e) => updateConsent('marketing', e.target.checked)}
                />
                <span>Marketing (personalization)</span>
              </label>
            </div>
            <div className="cookie-actions">
              <button onClick={() => handleCookieConsent()} className="cookie-accept">
                Accept Selected
              </button>
              <button onClick={() => handleCookieConsent()} className="cookie-accept-all">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-container">
        <div id="progress-bar"></div>
      </div>

      {/* Fullscreen Toggle */}
      <button className="fullscreen-toggle" onClick={toggleFullscreen}>
        ⛶
      </button>

      {/* Previous / Next Buttons */}
      <button
        className="scroll-btn prev"
        onClick={() => scrollToSection(activeIndex - 1)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button
        className="scroll-btn next"
        onClick={() => scrollToSection(activeIndex + 1)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      {/* Horizontal Scroll Sections */}
      <div 
        className="horizontal-scroll" 
        ref={containerRef}
        onTouchStart={handleTouchStart}
      >
        {/* SLIDE 1 - Hero */}
        <section className="slide hero-slide">
          <div className="parallax-bg"></div>
          <h1 className="slide-title">LPM System</h1>
          <p className="slide-subtitle">Learner Placement & Workplace Host Management System</p>
          <p className="slide-description">
            QCTO & SETA Aligned Digital Solution for Modern Technical Education
          </p>
          <button onClick={() => navigate("/signup")} className="cta-btn">
            Get Started
          </button>
          <div className="social-share">
            <span>Share:</span>
            <button onClick={() => shareOnSocial('twitter')}>𝕏</button>
            <button onClick={() => shareOnSocial('facebook')}>f</button>
            <button onClick={() => shareOnSocial('linkedin')}>in</button>
          </div>
        </section>

        {/* SLIDE 2 - About */}
        <section className="slide">
          <h2 className="slide-title">About LPM System</h2>
          <p className="slide-content">
            The Learner Placement & Workplace Host Management System is a centralised digital solution designed to manage learner workplace placements in full alignment with QCTO and SETA requirements. Our platform supports the complete placement lifecycle tracking, comprehensive document management, real-time compliance monitoring, and advanced reporting capabilities across multiple stakeholders and geographic locations.
          </p>
        </section>

        {/* SLIDE 3 - Features */}
        <section className="slide">
          <h2 className="slide-title">Core Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Placement Lifecycle Tracking</h3>
              <p>End-to-end placement management from application to completion</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">�</div>
              <h3>Document Management</h3>
              <p>Secure storage and verification of learner documents</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>QCTO Compliance Monitoring</h3>
              <p>Real-time compliance tracking against QCTO standards</p>
            </div>
          </div>
        </section>

        {/* SLIDE 4 - Gallery */}
        <section className="slide">
          <h2 className="slide-title">Platform Interface</h2>
          <div className="gallery-container">
            <div className="gallery-grid">
              {screenshots.map((screenshot) => (
                <div 
                  key={screenshot.id}
                  className={`gallery-item ${selectedImage === screenshot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedImage(screenshot.id)}
                >
                  <div className="screenshot-placeholder">
                    �️
                  </div>
                  <div className="screenshot-info">
                    <h4>{screenshot.title}</h4>
                    <p>{screenshot.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedImage && (
              <div className="image-modal" onClick={() => setSelectedImage(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
                  <h3>{screenshots.find(s => s.id === selectedImage)?.title}</h3>
                  <div className="modal-image">
                    <div className="screenshot-large">
                      �️ Platform Interface {selectedImage}
                    </div>
                  </div>
                  <p>{screenshots.find(s => s.id === selectedImage)?.description}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SLIDE 5 - QCTO Compliance */}
        <section className="slide">
          <h2 className="slide-title">QCTO & SETA Compliance</h2>
          <div className="compliance-features">
            <div className="compliance-item">
              <div className="compliance-icon">📚</div>
              <h3>QCTO Aligned</h3>
              <p>Fully compliant with Quality Council for Trades and Occupations standards</p>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon">🏛️️</div>
              <h3>SETA Registered</h3>
              <p>Meets Sector Education and Training Authority requirements</p>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon">🔒</div>
              <h3>POPIA Compliant</h3>
              <p>Protection of Personal Information Act aligned data handling</p>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon">📊</div>
              <h3>NQF Alignment</h3>
              <p>National Qualifications Framework integration</p>
            </div>
          </div>
        </section>

        {/* SLIDE 6 - Stakeholders */}
        <section className="slide">
          <h2 className="slide-title">Multi-Stakeholder Support</h2>
          <div className="stakeholders-grid">
            <div className="stakeholder-group">
              <h3>🏫 Educational Institutions</h3>
              <p>TVET Colleges, Universities, Schools</p>
            </div>
            <div className="stakeholder-group">
              <h3>🏢 Workplace Hosts</h3>
              <p>Registered and approved workplace providers</p>
            </div>
            <div className="stakeholder-group">
              <h3>👥 Learners</h3>
              <p>Students, apprentices, interns</p>
            </div>
            <div className="stakeholder-group">
              <h3>🏢 Employers</h3>
              <p>Industry partners and placement companies</p>
            </div>
            <div className="stakeholder-group">
              <h3>🏛️️ Government Bodies</h3>
              <p>SETA, QCTO, DHET</p>
            </div>
            <div className="stakeholder-group">
              <h3>📊 Assessment Centers</h3>
              <p>Registered assessment venues</p>
            </div>
          </div>
        </section>

        {/* SLIDE 7 - FAQ */}
        <section className="slide">
          <h2 className="slide-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {[
              { q: "How does the system ensure QCTO compliance?", a: "Our platform is built around QCTO unit standards and includes automated compliance checking." },
              { q: "Can SETA requirements be customized?", a: "Yes, the system supports flexible configuration for different SETA requirements." },
              { q: "How are workplace hosts vetted?", a: "All hosts undergo rigorous verification and approval processes." },
              { q: "Is the system POPIA compliant?", a: "Yes, we implement strict data protection and privacy measures." },
              { q: "Can multiple institutions use the system?", a: "Yes, multi-tenant architecture supports separate institutional data." },
              { q: "How does reporting work?", a: "Real-time dashboards and automated QCTO/SETA compliant reporting." }
            ].map((faq, index) => (
              <div key={index} className="faq-item">
                <button 
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.q}
                  <span>{expandedFAQ === index ? '−' : '+'}</span>
                </button>
                <div className={`faq-answer ${expandedFAQ === index ? 'expanded' : ''}`}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SLIDE 8 - Contact */}
        <section className="slide">
          <h2 className="slide-title">Get In Touch</h2>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <input
              type="text"
              placeholder="Institution Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="email"
              placeholder="Contact Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <textarea
              placeholder="Tell us about your placement needs"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
            />
            <button type="submit">Send Message</button>
          </form>
          
          <div className="newsletter-section">
            <h3>Stay Updated</h3>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Your email for updates"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </section>
      </div>

      {/* Bottom Navigation Dots */}
      <div className="nav-dots-bottom">
        {sections.map((_, i) => (
          <span
            key={i}
            className={`dot ${i === activeIndex ? "active" : ""}`}
            onClick={() => scrollToSection(i)}
          ></span>
        ))}
      </div>
    </>
  );
};

export default LandingPage;
