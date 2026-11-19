import React from "react";
import { FileText, Mail, Users, Lock, Globe } from "lucide-react";
import LegalPageLayout from "./LegalPageLayout";
import PolicySection from "./PolicySection";
import PolicyList from "./PolicyList";

const TermsAndConditions: React.FC = () => (
  <LegalPageLayout
    label="Terms & conditions"
    icon={<FileText className="w-4 h-4" />}
    titleLead="Simple rules for a"
    titleHighlight="strong community."
    intro="Use Yare Height Learning Hub responsibly, be kind to others, and let’s learn together."
    footnote={<>Governed by the laws of <strong style={{ color: "var(--lp-ink)" }}>Nigeria</strong></>}
  >
    <PolicySection title="1. Acceptance" icon={<FileText className="w-5 h-5" />}>
      <p>
        By using Yare Height Learning Hub, you agree to these terms. If
        you don’t, please stop using our platform.
      </p>
    </PolicySection>

    <PolicySection title="2. Your Account" icon={<Users className="w-5 h-5" />}>
      <PolicyList items={["Keep your password safe", "You’re responsible for all activity"]} />
    </PolicySection>

    <PolicySection title="3. Be Respectful" icon={<Users className="w-5 h-5" />}>
      <PolicyList items={["No bullying, harassment, or hate speech", "Respect teachers and classmates"]} />
    </PolicySection>

    <PolicySection title="4. No Cheating" icon={<Lock className="w-5 h-5" />}>
      <p>Don’t share answers. Don’t use bots. Learning is real here.</p>
    </PolicySection>

    <PolicySection title="5. Content Ownership" icon={<Globe className="w-5 h-5" />}>
      <p>
        All lessons, videos, and quizzes belong to Yare Height Learning
        Hub. You may not copy or sell them.
      </p>
    </PolicySection>

    <PolicySection title="6. We Can Update" icon={<FileText className="w-5 h-5" />}>
      <p>We may change these terms. We’ll notify you via email or in-app.</p>
    </PolicySection>

    <PolicySection title="7. Contact" icon={<Mail className="w-5 h-5" />}>
      <p>
        Email:{" "}
        <a href="mailto:legal@yare.ng" className="underline font-medium" style={{ color: "var(--lp-green-text)" }}>
          legal@yare.ng
        </a>
      </p>
    </PolicySection>
  </LegalPageLayout>
);

export default TermsAndConditions;
