import React from "react";
import { ShieldCheck, Eye, Lock, UserCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";

const SettingPrivacyPolicy: React.FC = () => {
  const sections = [
    {
      icon: <Eye className="w-5 h-5 text-emerald-600" />,
      title: "Information We Collect",
      body: "When you use our platform, we collect certain personal information to provide and improve our services. This includes but is not limited to your name, email address, and administrative role. We also collect non-personal information such as usage data, device information, and IP addresses to analyze trends and maintain platform integrity.",
    },
    {
      icon: <UserCheck className="w-5 h-5 text-emerald-600" />,
      title: "How We Use Your Information",
      body: "We use the information to operate, maintain, and improve our services. This includes customizing content, sending important updates, and providing support. We do not sell your personal information to third parties. We only share it with your explicit consent or when legally required to do so.",
    },
    {
      icon: <Lock className="w-5 h-5 text-emerald-600" />,
      title: "Data Security",
      body: "We employ physical, technical, and administrative measures to protect your information. Our security protocols include data encryption, access controls, and regular audits. While we strive for 100% security, we encourage you to use strong, unique passwords for your account.",
    },
  ];

  return (
    <div className="max-w-4xl text-left">
      {/* Header Section */}
      <header className="mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064e3b] rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <ShieldCheck size={12} /> Compliance & Trust
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tighter">
          Privacy & Safety Policy
        </h1>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Version 2.4.0</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full" />
          <span>Last Updated: Dec 2025</span>
        </div>
      </header>

      {/* Intro Paragraph */}
      <div className="mb-12">
        <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed border-l-4 border-yellow-400 pl-6">
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
              <div className="p-2.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                {section.icon}
              </div>
              <h3 className="text-xl font-black text-[#064e3b] tracking-tight italic">
                {section.title}
              </h3>
            </div>
            <p className="text-slate-500 font-bold leading-loose text-sm pl-14">
              {section.body}
            </p>
          </motion.section>
        ))}
      </div>

      {/* Rights Footer Section */}
      <div className="mt-16 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-white rounded-2xl shadow-sm">
            <FileText className="text-yellow-600 w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-black text-[#064e3b] tracking-tight mb-2">
              Your Data Rights
            </h4>
            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-6">
              You have the right to access, update, and request the deletion of
              your personal data. We are committed to empowering you with
              control over your information and will respond to requests in a
              timely manner.
            </p>
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-[#064e3b] hover:text-emerald-600 transition-colors flex items-center gap-2">
              Contact Compliance Officer <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legal Footer Note */}
      <p className="mt-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
        Yare Learning Hub • End-to-End Encryption Enabled
      </p>
    </div>
  );
};

export default SettingPrivacyPolicy;
