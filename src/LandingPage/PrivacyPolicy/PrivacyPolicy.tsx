import React from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy: React.FC = () => {
  return (
    <section className="policy-container">
      <div className="policy-section">
        <h2>Privacy Policy – Iyare Learning Hub</h2>

        <h4>1. Introduction</h4>
        <p>
          At Iyare Learning Hub, your privacy is important to us. This Privacy
          Policy explains how we collect, use, and protect your personal
          information when you interact with our website or use our services.
        </p>

        <h4>2. Information We Collect</h4>
        <ul>
          <li>Name and contact details (e.g., email, phone number)</li>
          <li>Demographic details</li>
          <li>Usage data (pages visited, actions taken)</li>
          <li>Communication preferences</li>
        </ul>

        <h4>3. How We Use Your Information</h4>
        <ul>
          <li>Provide educational content and services</li>
          <li>Improve our platform and user experience</li>
          <li>Send updates, newsletters, or learning materials</li>
          <li>Ensure security and prevent misuse</li>
        </ul>

        <h4>4. Sharing of Information</h4>
        <ul>
          <li>With trusted partners for service delivery</li>
          <li>When required by law or legal processes</li>
        </ul>

        <h4>5. Cookies</h4>
        <p>
          We use cookies to:
          <ul>
            <li>Remember your preferences</li>
            <li>Analyze site traffic</li>
            <li>Enhance your user experience</li>
          </ul>
          You can manage cookie settings in your browser.
        </p>

        <h4>6. Data Security</h4>
        <p>
          We implement security measures to protect your personal data. However,
          no method of transmission over the internet is 100% secure.
        </p>

        <h4>7. Your Rights</h4>
        <ul>
          <li>Request access to your personal data</li>
          <li>Ask for corrections or deletions</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h4>8. Changes to This Policy</h4>
        <p>
          We may update this policy. Changes will be posted here with a revised
          date.
        </p>

        <h4>9. Contact Us</h4>
        <p>Email: support@iyarelearninghub.org</p>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
