import React from "react";
import { motion } from "framer-motion";
import libraryImg from "../../assets/images/library.jpg";
import ScrollingCards from "./ScrollingCards";

const Hero: React.FC = () => {
  const stats = [
    { value: "500+", label: "Active Students", delay: 0.2 },
    { value: "98%", label: "Success Rate", delay: 0.4 },
    { value: "30+", label: "Expert Teachers", delay: 0.6 },
    { value: "4.9", label: "Student Rating", delay: 0.8 },
  ];

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <section className="relative min-h-screen bg-gradient-to-br from-[#023009] py-24 via-[#023009] to-[#ffd000] overflow-hidden">
        <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="text-white max-w-xl"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              >
                Welcome to{" "}
                <span className="text-[#ffd000] drop-shadow-md">
                  Yare Height
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed max-w-lg"
              >
                A Learning Hub where home lessons are digitalized, empowering
                young minds with world-class education, innovative teaching, and
                a thriving community of learners.
              </motion.p>

              {/* BUTTONS – Now open in NEW TAB */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                {/* EXPLORE SUBJECTS → opens /subjects in new tab */}
                <button
                  onClick={() => openInNewTab("/subjects")}
                  className="group bg-[#ffd000] text-[#023009] px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Explore Subjects
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>

                {/* GET STARTED → opens /register in new tab */}
                <button
                  onClick={() => openInNewTab("/register")}
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-[#023009] transition-all duration-300 backdrop-blur-sm"
                >
                  Get Started
                </button>
              </motion.div>
            </motion.div>

            {/* RIGHT – unchanged */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl w-80 h-96 lg:w-96 lg:h-[480px] group"
                >
                  <img
                    src={libraryImg}
                    alt="Yare Learning Hub - Students in Library"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>

                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: stat.delay, duration: 0.5 }}
                    className={`absolute p-4 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 ${
                      index % 2 === 0
                        ? "bg-[#ffd000] text-[#023009] -top-6 -left-6"
                        : "bg-white text-[#023009] -bottom-6 -right-6"
                    }`}
                  >
                    <p className="font-bold text-xl lg:text-2xl">
                      {stat.value}
                    </p>
                    <p className="text-xs lg:text-sm font-medium opacity-80">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-4 lg:mt-4">
          <ScrollingCards />
        </div>
      </section>
    </>
  );
};

export default Hero;
