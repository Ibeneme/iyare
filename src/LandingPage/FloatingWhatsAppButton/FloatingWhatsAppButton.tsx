// FloatingWhatsAppButton.tsx  (or put directly in your layout)
import React from "react";
import { motion } from "framer-motion";


const FloatingWhatsAppButton: React.FC = () => {
  const phoneNumber = "+2347067363653"; // Change if needed
  const whatsappLink = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=Hi%20Yare!%20I%20have%20a%20question%20about%20enrollment.&type=phone_number&app_absent=0`;

  return (
    <motion.a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Pulsing Background Ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-20 animate-ping" />
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 scale-75 animate-ping animation-delay-1000" />

      {/* Main Button */}
      <div className="relative flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full shadow-2xl border-4 border-white">
        {/* WhatsApp Logo (SVG) */}
        <svg
          viewBox="0 0 24 24"
          className="w-9 h-9 text-white drop-shadow-md"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.263c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
        </svg>

        {/* Optional: Floating Badge */}
        <span className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 bg-[#ffd000] text-[#023009] rounded-full font-black text-xs shadow-lg border-2 border-white animate-bounce">
          1
        </span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-[#023009] text-white text-sm font-bold px-4 py-2 rounded-lg shadow-xl">
          Chat with us on WhatsApp
          <div className="absolute bottom-0 right-6 translate-y-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#023009]" />
        </div>
      </div>
    </motion.a>
  );
};

export default FloatingWhatsAppButton;
