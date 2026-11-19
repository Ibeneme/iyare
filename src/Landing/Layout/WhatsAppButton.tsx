// FloatingWhatsAppButton.tsx
import React from "react";
import { motion } from "framer-motion";

const FloatingWhatsAppButton: React.FC = () => {
  const phoneNumber = "+2347067363653";
  const whatsappLink = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=Hi%20Yare!%20I%20have%20a%20question%20about%20enrollment.&type=phone_number&app_absent=0`;

  return (
    <motion.a
      aria-label="Chat with us on WhatsApp"
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group flex items-center select-none opacity-80 hover:opacity-100 focus:outline-none rounded-full transition-opacity duration-200"
      initial={{ scale: 0.7, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 0.8, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      whileHover={{ scale: 1.05, y: -2, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Hover Callout Pill */}
      <div className="hidden sm:flex items-center gap-2 mr-3 px-4 py-2 rounded-full bg-[var(--lp-green-deep)]/85 text-white/85 text-xs font-medium tracking-wide shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[var(--lp-yellow)]/75" />
        <span>Chat with us on WhatsApp</span>
      </div>

      {/* Main Floating Dock Button */}
      <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full">
        {/* Soft Dimmed Pulse Halo */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[var(--lp-green-deep)]/20 animate-ping"
          style={{ animationDuration: "2.6s" }}
        />

        {/* Core Surface (No Borders) */}
        <div className="relative flex items-center justify-center w-full h-full rounded-full bg-[var(--lp-green-deep)]/85 text-white/85 shadow-[0_10px_24px_-6px_rgba(0,0,0,0.45)] transition-all duration-200 group-hover:bg-[var(--lp-green-deep)] group-hover:text-white">
          {/* WhatsApp Icon */}
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 group-hover:scale-105"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.263c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
        </div>
      </div>
    </motion.a>
  );
};

export default FloatingWhatsAppButton;