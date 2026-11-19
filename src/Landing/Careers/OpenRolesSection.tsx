import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Banknote, MapPin } from "lucide-react";
import { SectionLabel } from "../Shared/index";

interface Job {
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  salary?: string;
  perks: string[];
  description: string;
}

const openRoles: Job[] = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Lagos, Nigeria (Hybrid)",
    type: "Full-time",
    salary: "₦8M – ₦12M / year",
    perks: ["Equity", "Health Insurance", "Learning Budget", "Relocation Support"],
    description: "Shape the future of learning in Africa by leading our React and Node stack.",
  },
  {
    title: "Content Creator (Science & Math)",
    department: "Curriculum",
    location: "Remote (Nigeria)",
    type: "Full-time",
    salary: "₦3.5M – ₦5M / year",
    perks: ["Flexible Hours", "Creative Freedom", "Teacher Training"],
    description: "Craft lively WAEC and JAMB lessons that spark curiosity in 100,000+ students.",
  },
  {
    title: "Customer Success Lead",
    department: "Support",
    location: "Abuja, Nigeria",
    type: "Full-time",
    salary: "₦4M – ₦6M / year",
    perks: ["Performance Bonus", "Parental Leave", "Team Offsites"],
    description: "Be the friendly voice of Yare Height Learning Hub and help every family succeed.",
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote (West Africa)",
    type: "Contract",
    salary: "₦500k – ₦800k / month",
    perks: ["Remote First", "Design Tools", "Mentorship"],
    description: "Design learning experiences that feel natural to Nigerian students.",
  },
];

/** List of open jobs; each card has an Apply link that opens an email. */
const OpenRolesSection: React.FC = () => (
  <section aria-labelledby="open-roles-title" className="lp-section pt-4">
    <div className="lp-container">
      <div className="text-center">
        <SectionLabel tone="green" dot>We’re hiring</SectionLabel>
        <h2 id="open-roles-title" className="lp-h2 mt-5">Roles you can <span className="lp-gradient-text">apply for today</span></h2>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        {openRoles.map((job, i) => (
          <motion.article
            key={job.title}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 2) * 0.1 }}
            className="group lp-card p-7 flex flex-col h-full"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="lp-h3" style={{ fontSize: "1.5rem" }}>{job.title}</h3>
                <p className="text-sm lp-muted mt-1">{job.department}</p>
              </div>
              <span className="lp-label shrink-0">{job.type}</span>
            </div>

            <ul className="mt-5 space-y-2 text-sm lp-muted">
              <li className="flex items-center gap-2"><MapPin size={16} style={{ color: "var(--lp-green-text)" }} /> {job.location}</li>
              {job.salary && <li className="flex items-center gap-2"><Banknote size={16} style={{ color: "var(--lp-green-text)" }} /> {job.salary}</li>}
            </ul>

            <p className="mt-5 flex-1 lp-muted">{job.description}</p>

            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Perks">
              {job.perks.map((perk) => (
                <li key={perk} className="lp-label lp-label--green" style={{ fontWeight: 500 }}>{perk}</li>
              ))}
            </ul>

            <a
              href={`mailto:careers@yare.education?subject=Application: ${job.title}`}
              className="lp-btn lp-btn--dark mt-6 self-start"
            >
              Apply now <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default OpenRolesSection;
