import React, { useState } from "react";
import { Bell, Mail, Newspaper, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";

const SettingNotifications: React.FC = () => {
  const [isEmailActive, setIsEmailActive] = useState(true);
  const [isNewsletterActive, setIsNewsletterActive] = useState(false);
  const [isSystemActive, setIsSystemActive] = useState(true);

  const anyActive = isEmailActive || isNewsletterActive || isSystemActive;

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    type: string
  ) => {
    setter((prev) => {
      const next = !prev;
      console.log(`${type} notifications toggled to: ${next}`);
      return next;
    });
  };

  // Custom Toggle Component for a premium feel
  const Toggle = ({
    active,
    onClick,
  }: {
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out outline-none border border-slate-200 ${
        active ? "bg-[#064e3b]" : "bg-slate-100"
      }`}
    >
      <motion.div
        animate={{ x: active ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`w-4 h-4 rounded-full shadow-sm mt-[1px] ${
          active ? "bg-yellow-400" : "bg-white"
        }`}
      />
    </button>
  );

  return (
    <div className="max-w-4xl text-left">
      {/* Header Section */}
      <header className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064e3b] rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <Bell size={12} /> Communication Preferences
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tighter">
          Notifications
        </h1>

        {/* Connection Status Badge */}
        <div className="flex items-center gap-3 pt-2">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-500 ${
              anyActive
                ? "bg-emerald-50 border-emerald-100 text-[#064e3b]"
                : "bg-slate-50 border-slate-100 text-slate-400"
            }`}
          >
            <Activity size={14} className={anyActive ? "animate-pulse" : ""} />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Status: {anyActive ? "Relay Active" : "Relay Silent"}
            </span>
          </div>
        </div>
      </header>

      {/* Control List */}
      <div className="space-y-4">
        {[
          {
            id: "email",
            title: "Email Notifications",
            desc: "Critical account alerts, billing updates, and security logs.",
            icon: <Mail size={18} />,
            state: isEmailActive,
            setter: setIsEmailActive,
          },
          {
            id: "news",
            title: "The Yare Newsletter",
            desc: "Weekly digests, community highlights, and new course drops.",
            icon: <Newspaper size={18} />,
            state: isNewsletterActive,
            setter: setIsNewsletterActive,
          },
          {
            id: "sys",
            title: "System Console",
            desc: "Administrative logs and real-time environment status updates.",
            icon: <ShieldCheck size={18} />,
            state: isSystemActive,
            setter: setIsSystemActive,
          },
        ].map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-emerald-200 transition-all duration-300"
          >
            <div className="flex items-start gap-5">
              <div
                className={`p-3 rounded-2xl transition-colors duration-300 ${
                  item.state
                    ? "bg-emerald-50 text-[#064e3b]"
                    : "bg-slate-50 text-slate-300"
                }`}
              >
                {item.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#064e3b] tracking-tight italic">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-bold leading-relaxed max-w-xs">
                  {item.desc}
                </p>
              </div>
            </div>

            <Toggle
              active={item.state}
              onClick={() => handleToggle(item.setter, item.title)}
            />
          </div>
        ))}
      </div>

      {/* Proactive Help Note */}
      <div className="mt-12 p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="text-[#064e3b]" />
        </div>
        <div className="text-center md:text-left">
          <h4 className="text-sm font-black text-[#064e3b] uppercase tracking-widest mb-1">
            Privacy Guarantee
          </h4>
          <p className="text-xs text-slate-400 font-bold leading-relaxed">
            We respect your focus. Critical security alerts will always bypass
            these settings to ensure the safety of your administrative account.
          </p>
        </div>
      </div>

      <p className="mt-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
        Notification Engine v1.0.4 • Yare Learning Hub
      </p>
    </div>
  );
};

export default SettingNotifications;
