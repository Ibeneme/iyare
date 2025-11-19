import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-lg w-full"
      >
        {/* 404 Text with Cool Shadow Effect */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-9xl md:text-[180px] font-black text-[#ffd000] relative inline-block"
          style={{
            textShadow: `
              6px 6px 0 #023009,
              -6px -6px 0 #023009,
              6px -6px 0 #023009,
              -6px 6px 0 #023009,
              0 0 20px rgba(2, 48, 9, 0.3)
            `,
          }}
        >
          404
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-4xl font-bold text-[#023009] mt-6"
        >
          Oops! Page Not Found
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-600 text-lg mt-4 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved.
          <br className="hidden sm:block" />
          Don't worry, even the best explorers get lost sometimes!
        </motion.p>

        {/* Fun Icon */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 10 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 4,
            ease: "easeInOut",
          }}
          className="my-10"
        >
          <BookOpen className="w-24 h-24 mx-auto text-[#ffd000] opacity-80" />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
        >
          <button
            onClick={goHome}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#023009] text-white font-bold text-lg rounded-full hover:bg-[#012009] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>

          <button
            onClick={goBack}
            className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#ffd000] text-[#023009] font-bold text-lg rounded-full hover:bg-[#e6c200] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-[#023009]/20"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            Go Back
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
