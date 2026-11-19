import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, User, X } from "lucide-react";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  class: string;
  subjects: string[];
}

interface Props {
  planName: string;
  students: Student[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  getGradeTitle: (id: string) => string;
  getSubjectName: (id: string) => string;
  totalText: string;
  onClose: () => void;
  onProceed: () => void;
}

/** Dialog where a parent chooses which children to pay for. */
const PaymentConfirmModal: React.FC<Props> = ({
  planName, students, selectedIds, onToggle, getGradeTitle, getSubjectName, totalText, onClose, onProceed,
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pay-title">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col rounded-t-[1.75rem] sm:rounded-[1.75rem]"
      style={{ background: "var(--lp-surface)", color: "var(--lp-ink)" }}
    >
      <div className="p-6 flex items-start justify-between gap-4">
        <div>
          <h2 id="pay-title" className="lp-h3" style={{ fontSize: "1.6rem" }}>Who is this plan for?</h2>
          <p className="lp-muted text-sm mt-1">Choose the children to include in the <strong>{planName}</strong> plan.</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="w-10 h-10 shrink-0 grid place-items-center rounded-full hover:bg-[var(--lp-green-soft)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
        {students.map((student) => {
          const isSelected = selectedIds.has(student._id);
          const subjectNames = student.subjects.map(getSubjectName);
          return (
            <motion.div
              key={student._id}
              layout
              className="p-5 rounded-3xl transition-colors"
              style={{ background: isSelected ? "var(--lp-yellow-soft)" : "var(--lp-green-soft)" }}
            >
              <label className="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(student._id)} className="sr-only" />
                <span
                  className="w-7 h-7 rounded-full border-2 grid place-items-center shrink-0"
                  style={{ borderColor: "var(--lp-green)", background: isSelected ? "var(--lp-green)" : "transparent" }}
                  aria-hidden="true"
                >
                  <motion.span initial={{ scale: 0 }} animate={{ scale: isSelected ? 1 : 0 }} className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--lp-yellow)" }} />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 font-semibold"><User className="w-4 h-4" /> {student.firstName} {student.lastName}</span>
                  <span className="flex items-center gap-2 text-sm lp-muted mt-0.5"><BookOpen className="w-4 h-4" /> {getGradeTitle(student.class)}</span>
                </span>
              </label>

              {subjectNames.length > 0 && (
                <div className="mt-4 pl-11 flex flex-wrap gap-2">
                  {subjectNames.map((name, i) => (
                    <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--lp-green)", color: "var(--lp-on-green)" }}>{name}</span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="p-6" style={{ background: "var(--lp-sand)" }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm lp-muted">Children selected</p>
            <p className="text-2xl font-semibold">{selectedIds.size} student{selectedIds.size !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-sm lp-muted">Total to pay</p>
            <p className="text-3xl font-semibold">{totalText}</p>
          </div>
        </div>
        <button onClick={onProceed} disabled={selectedIds.size === 0} className="lp-btn lp-btn--dark lp-btn--lg w-full disabled:opacity-50 disabled:cursor-not-allowed">
          {selectedIds.size === 0 ? "Pick at least one child" : `Pay ${totalText}`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  </div>
);

export default PaymentConfirmModal;
