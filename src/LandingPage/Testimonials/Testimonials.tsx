// src/components/TestimonialsCarousel/TestimonialsCarousel.tsx
import React from "react";
import { motion } from "framer-motion";
import { Star, Quote, User, Users } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  remark: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Mrs. Ngozi Nwafor",
    role: "Parent, Port Harcourt",
    remark:
      "YARE HEIGHT Learning HUB has made learning so engaging. My daughter now enjoys studying every evening and looks forward to her lessons.",
    rating: 5,
  },
  {
    name: "Mr. Tamuno Briggs",
    role: "Father, Bonny Island",
    remark:
      "I can monitor my son’s learning easily from my phone. The progress updates and lesson recaps make a big difference.",
    rating: 5,
  },
  {
    name: "Miss Chidinma Okeke",
    role: "Student, Oyigbo",
    remark:
      "Learning is fun and interactive. I’ve improved a lot in English and Maths — the lessons feel like games!",
    rating: 5,
  },
  {
    name: "Mr. Baribote West",
    role: "Teacher, Bori",
    remark:
      "The teaching tools are simple but powerful. I can teach and assess my students effectively without stress.",
    rating: 5,
  },
  {
    name: "Mrs. Amaka Eke",
    role: "Parent, Omoku",
    remark:
      "My children now study consistently at home. It’s comforting knowing I can track their performance anytime.",
    rating: 5,
  },
  {
    name: "Miss Preye Douglas",
    role: "Guardian, Ahoada",
    remark:
      "The lessons are well explained, and my niece is improving daily. It’s easy to use and very reliable.",
    rating: 5,
  },
  {
    name: "Mr. Chibuike Diri",
    role: "Parent, Okrika",
    remark:
      "My kids enjoy every session. It’s stress-free and keeps them busy with something productive after school hours.",
    rating: 5,
  },
  {
    name: "Mrs. Ijeoma Azubuike",
    role: "Teacher, Eleme",
    remark:
      "I love the creativity in the lessons. It helps me teach with more confidence, and the learners respond better too.",
    rating: 5,
  },
];

// Duplicate for seamless loop
const doubledTestimonials = [...testimonials, ...testimonials];

const TestimonialsCarousel: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-b from-[#f5fdf5] to-white py-32 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-circuit-pattern bg-[length:200px_200px]" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-[#023009]/5 px-6 py-3 rounded-full mb-6 border-2 border-[#ffd000]">
            <Quote className="w-5 h-5 text-[#ffd000]" />
            <span className="text-[#023009] font-mono text-sm tracking-widest">
              VOICES FROM YARE HEIGHT Learning HUB
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-[#023009] mb-4">
            Loved by
            <span className="block text-[#023009]">
              <span className="inline-block border-b-4 border-[#ffd000] pb-1">
                Parents and Families
              </span>
            </span>
          </h2>
          <p className="text-xl text-[#023009]/70 max-w-3xl mx-auto">
            Parents, learners, and teachers — all experiencing learning in a new
            way.
          </p>
        </div>

        {/* Infinite Carousel */}
        <div className="overflow-hidden">
          <motion.div
            animate={{ x: [0, -100 * testimonials.length + "%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 120, // slower, smoother scroll
                ease: "linear",
              },
            }}
            className="flex gap-8"
          >
            {doubledTestimonials.map((t, index) => (
              <div key={index} className="flex-shrink-0 w-96">
                <div className="bg-white p-8 rounded-3xl border-2 border-[#ffd000] h-full flex flex-col justify-between transition-all duration-300 hover:border-[#023009]">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#023009]/10 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-[#023009]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#023009] text-lg">
                          {t.name}
                        </h4>
                        <p className="text-sm text-[#023009]/70 flex items-center gap-1">
                          {t.role.includes("Parent") ||
                          t.role.includes("Father") ||
                          t.role.includes("Guardian") ? (
                            <Users className="w-4 h-4" />
                          ) : t.role.includes("Teacher") ? (
                            <Quote className="w-4 h-4" />
                          ) : (
                            <Star className="w-4 h-4" />
                          )}
                          {t.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-[#ffd000] text-[#ffd000]"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Remark */}
                  <p className="text-[#023009]/80 leading-relaxed flex-grow">
                    "{t.remark}"
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <div className="text-center mt-16">
          <p className="text-[#023009]/60 text-sm font-mono tracking-widest">
            <strong className="text-[#023009]">8,742+</strong> active users •
            <strong className="text-[#023009] border-b-2 border-[#ffd000]">
              4.9/5
            </strong>{" "}
            average rating
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
