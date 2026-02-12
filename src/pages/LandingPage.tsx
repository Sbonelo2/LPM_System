import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const sections = ["Home", "About", "Features", "Get Started"];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  /* ===== Auto Scroll Storytelling ===== */
  useEffect(() => {
    const interval = setInterval(() => {
      scrollToSection(activeIndex + 1);
    }, 8000); // change slide every 8s

    return () => clearInterval(interval);
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

  return (
    <>
      {/* Progress Bar */}
      <div className="progress-container">
        <div id="progress-bar"></div>
      </div>

      {/* Previous / Next Buttons */}
      <button
        className="scroll-btn prev"
        onClick={() => scrollToSection(activeIndex - 1)}
      >
        &#10094;
      </button>
      <button
        className="scroll-btn next"
        onClick={() => scrollToSection(activeIndex + 1)}
      >
        &#10095;
      </button>

      {/* Horizontal Scroll Sections */}
      <div className="horizontal-scroll" ref={containerRef}>
        {/* SLIDE 1 */}
        <section className="slide hero-slide">
          <div className="parallax-bg"></div>
          <h1>LPM System</h1>
          <p>Learner Placement Management System</p>
          <button onClick={() => navigate("/signup")} className="cta-btn">
            Get Started
          </button>
        </section>

        {/* SLIDE 2 */}
        <section className="slide">
          <h2>About LPM</h2>
          <p>
            Streamline learner placements with intelligent tracking and
            compliance tools.
          </p>
        </section>

        {/* SLIDE 3 */}
        <section className="slide">
          <h2>Key Features</h2>
          <p>Document control, placement tracking, reporting & more.</p>
        </section>

        {/* SLIDE 4 */}
        <section className="slide">
          <h2>Join Us Today</h2>
          <p>Empowering institutions across South Africa.</p>
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
