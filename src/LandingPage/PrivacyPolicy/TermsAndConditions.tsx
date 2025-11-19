// src/pages/TermsAndConditions/TermsAndConditions.tsx
import React from "react";
import { FileText, Mail, Users, Lock, Globe } from "lucide-react";

const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen mt-12 bg-gradient-to-b from-white to-[#f5fdf5] py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]">
            <FileText className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-black text-sm tracking-widest">
              TERMS & CONDITIONS
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-[#023009] mb-4">
            Simple Rules.
            <span className="block text-[#ffd000]">Strong Community.</span>
          </h1>
          <p className="text-lg text-[#023009]/70 max-w-2xl mx-auto">
            Use Yare Height Learning Hub responsibly. Respect others. Learn
            together.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl border-4 border-[#ffd000] p-10 space-y-10">
          <Section
            title="1. Acceptance"
            icon={<FileText className="w-6 h-6" />}
          >
            <p className="text-[#023009]/80">
              By using Yare Height Learning Hub, you agree to these terms. If
              you don’t, please stop using our platform.
            </p>
          </Section>

          <Section title="2. Your Account" icon={<Users className="w-6 h-6" />}>
            <ul className="space-y-3 text-[#023009]/80">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Keep your password safe</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>You’re responsible for all activity</span>
              </li>
            </ul>
          </Section>

          <Section
            title="3. Be Respectful"
            icon={<Users className="w-6 h-6" />}
          >
            <ul className="space-y-3 text-[#023009]/80">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>No bullying, harassment, or hate speech</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#023009] rounded-full mt-2"></div>
                <span>Respect teachers and classmates</span>
              </li>
            </ul>
          </Section>

          <Section title="4. No Cheating" icon={<Lock className="w-6 h-6" />}>
            <p className="text-[#023009]/80">
              Don’t share answers. Don’t use bots. Learning is real here.
            </p>
          </Section>

          <Section
            title="5. Content Ownership"
            icon={<Globe className="w-6 h-6" />}
          >
            <p className="text-[#023009]/80">
              All lessons, videos, and quizzes belong to Yare Height Learning
              Hub. You may not copy or sell them.
            </p>
          </Section>

          <Section
            title="6. We Can Update"
            icon={<FileText className="w-6 h-6" />}
          >
            <p className="text-[#023009]/80">
              We may change these terms. We’ll notify you via email or in-app.
            </p>
          </Section>

          <Section title="7. Contact" icon={<Mail className="w-6 h-6" />}>
            <p className="text-[#023009]/80">
              Email:{" "}
              <a
                href="mailto:legal@yare.ng"
                className="text-[#023009] underline font-medium"
              >
                legal@yare.ng
              </a>
            </p>
          </Section>
        </div>

        {/* Trust Badge */}
        <p className="text-center mt-12 text-[#023009]/60 text-sm font-mono tracking-widest">
          Governed by the laws of{" "}
          <strong className="text-[#023009]">Nigeria</strong>
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

export default TermsAndConditions;
