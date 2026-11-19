import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, CreditCard, Mail } from "lucide-react";

export interface PaymentRecord {
  _id: string;
  studentName: string;
  amount: number;
  duration: string;
  expiresAt: string;
  paid: { timestamp: string; paymentMethod: string };
}

/** One paid subscription: who, how much, for how long and when it ends. */
const PaymentRecordCard: React.FC<{ payment: PaymentRecord; reference: string | null; index: number }> = ({ payment: p, reference, index }) => (
  <motion.li
    initial={{ opacity: 0, x: -18 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="rounded-3xl p-5 space-y-4 list-none"
    style={{ background: "var(--lp-green-soft)" }}
  >
    <div className="flex flex-wrap justify-between items-center gap-2">
      <span className="font-semibold">{p.studentName}</span>
      <span className="text-xs lp-muted break-all">Ref: {reference}</span>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
      {[
        { Icon: CreditCard, label: "Amount", value: `₦${p.amount.toLocaleString()}` },
        { Icon: Clock, label: "Plan length", value: p.duration },
        { Icon: Mail, label: "Valid until", value: new Date(p.expiresAt).toLocaleDateString("en-NG") },
      ].map(({ Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="w-9 h-9 grid place-items-center rounded-full" style={{ background: "var(--lp-surface)" }}><Icon className="w-4 h-4" style={{ color: "var(--lp-green-text)" }} /></span>
          <div>
            <p className="lp-muted text-xs">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="inline-flex items-center gap-1 font-medium" style={{ color: "var(--lp-green-text)" }}>
        <CheckCircle className="w-3.5 h-3.5" /> Paid with {p.paid.paymentMethod}
      </span>
      <span className="lp-muted">{new Date(p.paid.timestamp).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}</span>
    </div>
  </motion.li>
);

export default PaymentRecordCard;
