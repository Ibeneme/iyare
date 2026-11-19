import React from "react";
import { Shield, Lock, Mail, Globe } from "lucide-react";
import LegalPageLayout from "./LegalPageLayout";
import PolicySection from "./PolicySection";
import PolicyList from "./PolicyList";

const PrivacyPolicy: React.FC = () => (
  <LegalPageLayout
    label="Privacy policy"
    icon={<Shield className="w-4 h-4" />}
    titleLead="Your data,"
    titleHighlight="our duty."
    intro="We look after your information the way we’d look after our own family’s. No ads. No selling. Just learning."
    footnote={<>Last updated: <strong style={{ color: "var(--lp-ink)" }}>November 2025</strong></>}
  >
    <PolicySection title="1. Introduction" icon={<Lock className="w-5 h-5" />}>
      <p>
        At <strong>YARE HEIGHT Learning HUB</strong>, your privacy is sacred.
        This policy explains how we collect, use, and protect your data
        when you use our platform.
      </p>
    </PolicySection>

    <PolicySection title="2. Information We Collect" icon={<Globe className="w-5 h-5" />}>
      <PolicyList items={[
        "Name and contact details (email, phone)",
        "Child’s class, school, and progress",
        "Usage data (lessons viewed, quiz scores)",
      ]} />
    </PolicySection>

    <PolicySection title="3. How We Use Your Data" icon={<Shield className="w-5 h-5" />}>
      <PolicyList items={[
        "Deliver live classes and homework",
        "Improve lessons with AI insights",
        "Send parent reports and reminders",
      ]} />
    </PolicySection>

    <PolicySection title="4. We NEVER Sell Your Data" icon={<Lock className="w-5 h-5" />}>
      <p>
        No third-party ads. No data brokers. Your child’s progress stays
        between you, the teacher, and YARE HEIGHT Learning HUB.
      </p>
    </PolicySection>

    <PolicySection title="5. Security" icon={<Shield className="w-5 h-5" />}>
      <p>
        End-to-end encryption. COPPA-compliant. Regular security audits.
        We protect your data like a bank.
      </p>
    </PolicySection>

    <PolicySection title="6. Your Rights" icon={<Globe className="w-5 h-5" />}>
      <PolicyList items={[
        "Access your data anytime",
        "Delete account in one click",
        "Withdraw consent instantly",
      ]} />
    </PolicySection>

    <PolicySection title="7. Contact Us" icon={<Mail className="w-5 h-5" />}>
      <p>
        Email:{" "}
        <a href="mailto:privacy@yare.ng" className="underline font-medium" style={{ color: "var(--lp-green-text)" }}>
          privacy@yare.ng
        </a>
      </p>
    </PolicySection>
  </LegalPageLayout>
);

export default PrivacyPolicy;
