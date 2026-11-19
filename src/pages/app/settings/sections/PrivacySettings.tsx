import React from "react";
import { ShieldCheck, Eye, Lock, UserCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";

const SettingPrivacyPolicy: React.FC = () => {
  const sections = [
    {
      icon: <Eye className="w-5 h-5 text-[var(--color-success)]" />,
      title: "Information We Collect",
      body: "When you use our platform, we collect certain personal information to provide and improve our services. This includes but is not limited to your name, email address, and administrative role. We also collect non-personal information such as usage data, device information, and IP addresses to analyze trends and maintain platform integrity.",
    },
    {
      icon: <UserCheck className="w-5 h-5 text-[var(--color-success)]" />,
      title: "How We Use Your Information",
      body: "We use the information to operate, maintain, and improve our services. This includes customizing content, sending important updates, and providing support. We do not sell your personal information to third parties. We only share it with your explicit consent or when legally required to do so.",
    },
    {
      icon: <Lock className="w-5 h-5 text-[var(--color-success)]" />,
      title: "Data Security",
      body: "We employ physical, technical, and administrative measures to protect your information. Our security protocols include data encryption, access controls, and regular audits. While we strive for 100% security, we encourage you to use strong, unique passwords for your account.",
    },
  ];

  return (
    <div className="max-w-4xl text-left">
      {/* Header Section */}
      <header className="mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-lg text-[10px] font-semibold  tracking-tight border border-[var(--color-card-border)]">
          <ShieldCheck size={12} /> Compliance & Trust
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight">
          Privacy & Safety Policy
        </h1>
        <div className="flex items-center gap-4 text-[10px] font-semibold  tracking-tight text-[var(--color-muted)]">
          <span>Version 2.4.0</span>
          <span className="w-1 h-1 bg-[var(--color-subtle)] rounded-full" />
          <span>Last Updated: Dec 2025</span>
        </div>
      </header>

      {/* Intro Paragraph */}
      <div className="mb-12">
        <p className="text-lg md:text-xl text-[var(--color-primary)] font-medium leading-relaxed border-l-4 border-yellow-400 pl-6">
          At Yare Learning Hub, your privacy and safety are paramount. We are
          deeply committed to protecting your personal information and ensuring
          that your experience on our platform is secure and trustworthy.
        </p>
      </div>

      {/* Principles/Sections Grid */}
      <div className="space-y-10">
        {sections.map((section, idx) => (
          <motion.section
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2.5 bg-[var(--color-success-bg)] rounded-xl group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-fg)] transition-colors duration-300">
                {section.icon}
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-primary)] tracking-tight ">
                {section.title}
              </h3>
            </div>
            <p className="text-[var(--color-muted)] font-semibold leading-loose text-sm pl-14">
              {section.body}
            </p>
          </motion.section>
        ))}
      </div>

      {/* Rights Footer Section */}
      <div className="mt-16 p-8 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-card-border)]">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-[var(--color-card)] rounded-2xl shadow-[var(--shadow-card)]">
            <FileText className="text-[var(--color-warning)] w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-[var(--color-primary)] tracking-tight mb-2">
              Your Data Rights
            </h4>
            <p className="text-sm text-[var(--color-muted)] font-semibold leading-relaxed mb-6">
              You have the right to access, update, and request the deletion of
              your personal data. We are committed to empowering you with
              control over your information and will respond to requests in a
              timely manner.
            </p>
            <button className="text-[10px] font-semibold  tracking-[0.2em] text-[var(--color-primary)] hover:text-[var(--color-success)] transition-colors flex items-center gap-2">
              Contact Compliance Officer <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legal Footer Note */}
      <p className="mt-12 text-center text-[9px] font-semibold text-[var(--color-muted)]  tracking-[0.4em]">
        Yare Learning Hub • End-to-End Encryption Enabled
      </p>
    </div>
  );
};

export default SettingPrivacyPolicy;
