import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpen, CheckCircle, ChevronDown, GraduationCap, Globe2, Laptop, UserPlus } from "lucide-react";
import { SectionLabel } from "../Shared/index";

interface Faq { question: string; answer: string[]; icon: React.ReactNode }

const FAQS: Faq[] = [
  { question: "How do I register my child?", icon: <UserPlus size={18} />, answer: [
    "1. Visit yare.ng and press **Get started**.", "2. Enter your phone number or email.", "3. Pick a plan, or begin with the free trial.",
    "4. Add your child’s name, class and school.", "5. That’s it. Login details arrive by SMS and email." ] },
  { question: "How experienced are the teachers?", icon: <GraduationCap size={18} />, answer: [
    "Every teacher is a **verified graduate** with 3 to 15+ years in the classroom. Many are WAEC/JAMB examiners, former heads of department or ex-British Council trainers, and we accept only the top 5% of applicants." ] },
  { question: "Do you prepare children for the 11+?", icon: <CheckCircle size={18} />, answer: [
    "Yes. Our **dedicated 11+ programme** for UK independent schools covers verbal reasoning, non-verbal reasoning, maths and English in GL, CEM and ISEB styles." ] },
  { question: "How are classes delivered?", icon: <Laptop size={18} />, answer: [
    "Classes run live on video in small groups of up to 12. Learners get chat, a whiteboard, polls and breakout rooms, and recordings stay available around the clock." ] },
  { question: "Which countries do you serve?", icon: <Globe2 size={18} />, answer: [
    "Families in **Nigeria, the UK, USA, Canada, UAE and 20+ other countries** learn with us. With an internet connection, your child can join from anywhere." ] },
  { question: "Which curricula do you teach?", icon: <BookOpen size={18} />, answer: [
    "We cover **several curricula** so no child falls behind:", "**British • Nigerian • Australian • Ontario • US • EYFS**", "You can switch at any time in parent settings." ] },
  { question: "How can I follow my child’s progress?", icon: <BarChart3 size={18} />, answer: [
    "The **learner portal** shows a **monthly report** with:", "• Topics covered in class", "• Strengths and areas needing extra help", "• Overall progress and next steps",
    "Teachers are **always reachable** by chat or call to talk about your child’s growth." ] },
  { question: "Does the content match my child’s school syllabus?", icon: <CheckCircle size={18} />, answer: [
    "Yes. We **map every lesson** to your child’s school syllabus. Enter the school and class and we line the content up automatically, whether it is Lagos International School, Grange or a public school in Kano." ] },
];

/** Renders **bold** markers inside a line. */
const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>{text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} className="font-semibold text-[var(--lp-ink)]">{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>))}</>
);

/** Accordion of common questions. */
const FaqSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section aria-labelledby="faq-title" className="lp-section">
      <div className="lp-container max-w-4xl">
        <div className="text-center">
          <SectionLabel dot>Frequently asked</SectionLabel>
          <h2 id="faq-title" className="lp-h2 mt-5">Your questions, <span className="lp-gradient-text">answered</span></h2>
          <p className="lp-lead mt-4">From Lagos to London, here is what parents ask us most.</p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.question} className="lp-card overflow-hidden" style={isOpen ? { borderColor: "var(--lp-green-mid)" } : undefined}>
                <h3>
                  <button
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={isOpen ? { background: "var(--lp-green)", color: "#fff" } : { background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}>{f.icon}</span>
                    <span className="flex-1 font-semibold text-base sm:text-lg">{f.question}</span>
                    <ChevronDown className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} size={20} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 sm:pl-[4.5rem] space-y-2 text-sm sm:text-base leading-relaxed lp-muted">
                        {f.answer.map((line, k) => (<p key={k}><Rich text={line} /></p>))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="lp-muted mb-4">Still curious?</p>
          <a href="mailto:support@yare.ng" className="lp-btn lp-btn--dark lp-btn--lg">Contact support <ArrowRight size={18} /></a>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
