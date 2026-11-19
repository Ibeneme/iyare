import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { PersonAvatar, SectionLabel } from "../Shared/index";

interface Testimonial { name: string; role: string; remark: string; rating: number; avatar: number }

const TESTIMONIALS: Testimonial[] = [
  { name: "Mrs. Ngozi Nwafor", role: "Parent, Port Harcourt", rating: 5, avatar: 4, remark: "My daughter now looks forward to her evening lessons. Studying finally feels like something she enjoys." },
  { name: "Mr. Tamuno Briggs", role: "Father, Bonny Island", rating: 5, avatar: 0, remark: "From my phone I can see how my son is doing. The recaps and progress updates make a real difference." },
  { name: "Miss Chidinma Okeke", role: "Student, Oyigbo", rating: 5, avatar: 2, remark: "Lessons are lively and hands-on. My English and Maths have improved, and it sometimes feels like play." },
  { name: "Mr. Baribote West", role: "Teacher, Bori", rating: 5, avatar: 3, remark: "The tools are simple yet powerful. Teaching and assessing my class takes far less effort now." },
  { name: "Mrs. Amaka Eke", role: "Parent, Omoku", rating: 5, avatar: 1, remark: "My children study regularly at home now, and I can check how they are doing whenever I like." },
  { name: "Miss Preye Douglas", role: "Guardian, Ahoada", rating: 5, avatar: 4, remark: "Explanations are clear and my niece improves every week. It is easy to use and dependable." },
  { name: "Mr. Chibuike Diri", role: "Parent, Okrika", rating: 5, avatar: 5, remark: "After school my kids look forward to each session. It keeps them busy with something worthwhile." },
  { name: "Mrs. Ijeoma Azubuike", role: "Teacher, Eleme", rating: 5, avatar: 2, remark: "The creative lessons boost my confidence, and my learners respond to them so well." },
];

const LOOP = [...TESTIMONIALS, ...TESTIMONIALS];

/** Slowly scrolling row of testimonial cards. */
const TestimonialsSection: React.FC = () => (
  <section aria-labelledby="testimonials-title" className="lp-section overflow-hidden">
    <div className="lp-container text-center">
      <SectionLabel tone="green" dot>Voices from Yare Height</SectionLabel>
      <h2 id="testimonials-title" className="lp-h2 mt-5">Loved by <span className="lp-gradient-text">families like yours</span></h2>
      <p className="lp-lead mt-4 max-w-xl mx-auto">Parents, learners and teachers share how learning feels now.</p>
    </div>

    <div className="mt-12 overflow-hidden" role="list" aria-label="Testimonials">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 90, ease: "linear" } }}
        className="flex gap-5 w-max pl-5"
      >
        {LOOP.map((t, i) => (
          <figure key={i} role="listitem" aria-hidden={i >= TESTIMONIALS.length} className="lp-card w-[19rem] sm:w-96 p-7 flex flex-col justify-between shrink-0">
            <div className="flex gap-1" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: t.rating }).map((_, k) => (<Star key={k} size={17} fill="var(--lp-yellow)" color="var(--lp-yellow)" />))}
            </div>
            <blockquote className="mt-4 leading-relaxed flex-1">“{t.remark}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <PersonAvatar variant={t.avatar} size={44} />
              <div className="text-left"><p className="font-semibold">{t.name}</p><p className="text-sm lp-muted">{t.role}</p></div>
            </figcaption>
          </figure>
        ))}
      </motion.div>
    </div>

    <p className="mt-10 text-center text-sm lp-muted">
      <strong className="text-[var(--lp-ink)]">8,742+</strong> active users · <strong className="text-[var(--lp-ink)]">4.9/5</strong> average rating
    </p>
  </section>
);

export default TestimonialsSection;
