import React from "react";
import "./SettingPrivacyPolicy.css";

const SettingPrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-container">
      <h2>Privacy & Safety Policy</h2>
      <p>
        At Iyare Learning Hub, your privacy and safety are paramount. We are
        deeply committed to protecting your personal information and ensuring
        that your experience on our platform is both secure and trustworthy.
        This policy is designed to be transparent, outlining exactly how we
        collect, use, and protect your data.
      </p>

      <h3>Information We Collect</h3>
      <p>
        When you use our platform, we collect certain personal information to
        provide and improve our services. This includes but is not limited to
        your name, email address, and administrative role. We also collect
        non-personal information such as usage data, device information, and IP
        addresses to analyze trends, administer the site, and maintain platform
        integrity. This data helps us understand how our services are used,
        allowing us to personalize your experience and secure your account.
      </p>

      <h3>How We Use Your Information</h3>
      <p>
        We use the information we collect to operate, maintain, and improve our
        services. This includes customizing the content you see, sending you
        important updates about your account, and providing customer support. We
        also use aggregated, anonymized data for research and development to
        enhance our educational programs and features. We want to be clear: we
        do not sell your personal information to third parties. We only share it
        with your explicit consent or when legally required to do so to protect
        our rights and safety or the safety of others.
      </p>

      <p>
        Your role information is specifically used to tailor your access to
        different parts of the platform and to ensure that you receive relevant
        communications and support. This helps us create a more efficient and
        secure environment for all users, from learners to administrators.
      </p>

      <h3>Data Security</h3>
      <p>
        We take the security of your data seriously. We employ a combination of
        physical, technical, and administrative measures to protect your
        information from unauthorized access, alteration, disclosure, or
        destruction. Our security protocols include data encryption, access
        controls, and regular security audits to identify and address
        vulnerabilities. We continuously monitor our systems to ensure they meet
        the highest standards of data protection. While we strive to protect
        your personal information, no method of transmission over the internet
        or electronic storage is 100% secure. We encourage you to also take
        steps to protect your account, such as using a strong, unique password.
      </p>

      <h3>Your Rights</h3>
      <p>
        You have the right to access, update, and request the deletion of your
        personal data. If you have any questions about the data we hold, or if
        you wish to exercise these rights, please contact us directly. We are
        committed to empowering you with control over your personal information
        and will respond to your requests in a timely manner.
      </p>
    </div>
  );
};

export default SettingPrivacyPolicy;
