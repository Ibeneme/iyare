import "./Footer.css";

const Footer = () => {
  return (
    <footer className="porsche-footer">
      <div className="porsche-footer-inner">
        {/* Contact Us Section */}
        <div className="porsche-footer-section">
          <h3 className="porsche-footer-title">Contact Us</h3>
          <div className="porsche-footer-contact">
            <p>
              <a href="mailto:info@oduonline.org">info@IyareLearningHub.com </a>
            </p>
          </div>
        </div>
      </div>

      <div className="porsche-footer-bottom">
        &copy; {new Date().getFullYear()} Iyare Learning Hub. All rights
        reserved.
      </div>
    </footer>
  );
};

export default Footer;
