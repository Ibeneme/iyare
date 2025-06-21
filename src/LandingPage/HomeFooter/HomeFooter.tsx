// Footer.tsx
import { useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import {
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaFacebook,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";

import CenteredTextSection from "../CenteredTextSection/CenteredTextSection";
import "./HomeFooter.css";

const HomeFooter: React.FC = () => {
  const location = useLocation();
  const isBlogDetail = matchPath("/blog-details/:id", location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  return (
    <>
      {!isBlogDetail && !isAdminRoute && <CenteredTextSection />}

      <footer className="footer" data-aos="fade-up">
        <div className="footer-container">
          <div
            className="footer-section"
            data-aos="fade-up"
            data-aos-delay="100"
            style={{ marginRight: 48 }}
          >
            <h3>Yare Learning Hub</h3>
            <ul style={{ marginTop: 8, lineHeight: 2, color: "#ffffff90" }}>
              <li>
                Yare is an online learning hub committed to empowering learners
                worldwide with accessible, high-quality educational resources.
                We bridge the gap between knowledge and opportunity through
                inclusive, tech-driven learning experiences tailored to your
                growth.
              </li>
            </ul>
          </div>

          <div
            className="footer-section"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            <h3>Quick Links</h3>
            <ul>
              <li>
                <a href="/about-us">About Us</a>
              </li>
              <li>
                <a href="/courses">Courses</a>
              </li>
              <li>
                <a href="/our-team">Our Team</a>
              </li>
              <li>
                <a href="/events">Events</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
            </ul>
          </div>

          <div
            className="footer-section"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <h3>Contact Us</h3>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook className="social-icon" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram className="social-icon" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <FaTwitter className="social-icon" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="social-icon" />
              </a>
              <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="social-icon" />
              </a>
              <a href="https://t.me/yourchannel" target="_blank" rel="noopener noreferrer">
                <FaTelegramPlane className="social-icon" />
              </a>
            </div>
            <div className="footer-email">
              <a
                style={{ color: "#fff" }}
                href="mailto:info@IyareLearningHub.com"
              >
                info@IyareLearningHub.com
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>For Yare Learning Hub</p>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default HomeFooter;