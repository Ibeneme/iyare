// src/pages/PrivacyPolicy/PrivacyPolicy.tsx
import React from "react";
import { Shield, Lock, Mail, Globe } from "lucide-react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen mt-12 bg-gradient-to-b from-white to-[#f5fdf5] py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]">
            <Shield className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-black text-sm tracking-widest">
              PRIVACY POLICY
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#023009] mb-4">
            Your Data.
            <span className="block text-[#ffd000]">Our Duty.</span>
          </h1>
          <p className="text-lg text-[#023009]/70 max-w-2xl mx-auto">
            We protect your information like family. No ads. No selling. Just
            learning.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-10 space-y-10">
          <Section title="1. Introduction" icon={<Lock className="w-6 h-6" />}>
            <p className="text-[#023009]/80 leading-relaxed">
              At <strong>YARE HEIGHT Learning HUB</strong>, your privacy is sacred.
              This policy explains how we collect, use, and protect your data
              when you use our platform.
            </p>
          </Section>

          <Section
            title="2. Information We Collect"
            icon={<Globe className="w-6 h-6" />}
          >
            <ul className="space-y-3 text-[#023009]/80">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Name and contact details (email, phone)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Child’s class, school, and progress</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Usage data (lessons viewed, quiz scores)</span>
              </li>
            </ul>
          </Section>

          <Section
            title="3. How We Use Your Data"
            icon={<Shield className="w-6 h-6" />}
          >
            <ul className="space-y-3 text-[#023009]/80">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Deliver live classes and homework</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Improve lessons with AI insights</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Send parent reports and reminders</span>
              </li>
            </ul>
          </Section>

          <Section
            title="4. We NEVER Sell Your Data"
            icon={<Lock className="w-6 h-6" />}
          >
            <p className="text-[#023009]/80">
              No third-party ads. No data brokers. Your child’s progress stays
              between you, the teacher, and YARE HEIGHT Learning HUB.
            </p>
          </Section>

          <Section title="5. Security" icon={<Shield className="w-6 h-6" />}>
            <p className="text-[#023009]/80">
              End-to-end encryption. COPPA-compliant. Regular security audits.
              We protect your data like a bank.
            </p>
          </Section>

          <Section title="6. Your Rights" icon={<Globe className="w-6 h-6" />}>
            <ul className="space-y-3 text-[#023009]/80">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Access your data anytime</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Delete account in one click</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Withdraw consent instantly</span>
              </li>
            </ul>
          </Section>

          <Section title="7. Contact Us" icon={<Mail className="w-6 h-6" />}>
            <p className="text-[#023009]/80">
              Email:{" "}
              <a
                href="mailto:privacy@yare.ng"
                className="text-[#023009] underline font-medium"
              >
                privacy@yare.ng
              </a>
            </p>
          </Section>
        </div>

        {/* Trust Badge */}
        <p className="text-center mt-12 text-[#023009]/60 text-sm font-mono tracking-widest">
          Last updated:{" "}
          <strong className="text-[#023009]">November 2025</strong>
        </p>
      </div>
    </div>
  );
};

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-[#ffd000] rounded-xl text-[#023009]">{icon}</div>
      <h3 className="text-xl font-black text-[#023009]">{title}</h3>
    </div>
    <div className="pl-16">{children}</div>
  </div>
);

export default PrivacyPolicy;
