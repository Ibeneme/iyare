import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "./CenteredTextSection.css";

const CenteredTextSection: React.FC = () => {
  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  return (
    <section
      className="centered-text-section"
      style={{ backgroundColor:`var(--yellow)` }}
    >
      <h3 className="section-header" data-aos="fade-up">
        Contact Us
      </h3>

      <p className="section-paragraph" data-aos="fade-up" data-aos-delay="100">
        The home of bold sounds, big dreams, and unstoppable songwriters and
        composers. We are here to build bridges for breakthrough.
      </p>

      <a
        href="mailto:nexusmusicpublishing@gmail.com"
        className="cta-button"
        data-aos="fade-up"
        data-aos-delay="200"
        style={{
          textDecoration: "none",
          backgroundColor: `var(--dark-green)`,
          padding: `16px 48px`,
          color: "#fff",
          borderRadius: 488,
          marginTop: 24,
        }}
      >
        Contact Us
      </a>
    </section>
  );
};

export default CenteredTextSection;
