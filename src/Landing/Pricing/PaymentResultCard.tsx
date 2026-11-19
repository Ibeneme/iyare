import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import PaymentRecordCard, { PaymentRecord } from "./PaymentRecordCard";

interface Props {
  success: boolean;
  error: string | null;
  payments: PaymentRecord[];
  reference: string | null;
  verifiedAt: string;
  onContinue: () => void;
  onRetry: () => void;
  onSupport: () => void;
}

/** Final screen after Paystack sends the parent back: success summary or a friendly failure. */
const PaymentResultCard: React.FC<Props> = ({ success, error, payments, reference, verifiedAt, onContinue, onRetry, onSupport }) => (
  <motion.main
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="lp-card w-full max-w-2xl p-6 sm:p-10"
    style={{ boxShadow: "0 30px 60px -30px rgba(45,55,25,.35)" }}
  >
    <header className="text-center mb-8">
      <div className="w-20 h-20 rounded-full grid place-items-center mx-auto mb-5" style={{ background: success ? "var(--lp-yellow)" : "var(--lp-green-soft)" }}>
        {success
          ? <CheckCircle className="w-10 h-10" style={{ color: "var(--lp-on-yellow)" }} />
          : <XCircle className="w-10 h-10" style={{ color: "var(--lp-green-text)" }} />}
      </div>
      <h1 className="lp-h2" style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}>
        {success ? "You’re all set!" : "We couldn’t confirm that payment"}
      </h1>
      <p className="lp-muted mt-2">
        {success ? "Your subscription is now active." : "Don’t worry — nothing is lost. Try again or reach out to us."}
      </p>
    </header>

    {success && payments.length > 0 && (
      <section className="mb-8" aria-label="Subscription details">
        <h2 className="text-base font-semibold text-center mb-4">Your subscription</h2>
        <ul className="space-y-4">
          {payments.map((p, i) => (<PaymentRecordCard key={p._id} payment={p} reference={reference} index={i} />))}
        </ul>
      </section>
    )}

    {error && (
      <div className="rounded-3xl p-5 mb-6 text-center" style={{ background: "var(--lp-yellow-soft)" }} role="alert">
        <p className="font-medium">{error}</p>
        {error.includes("not found") && (
          <p className="text-sm mt-2 lp-muted">Please contact support and quote this reference: <strong>{reference}</strong></p>
        )}
      </div>
    )}

    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      {success ? (
        <button onClick={onContinue} className="lp-btn lp-btn--dark lp-btn--lg">Continue <ArrowRight className="w-4 h-4" /></button>
      ) : (
        <>
          <button onClick={onRetry} className="lp-btn lp-btn--yellow lp-btn--lg">Try again</button>
          <button onClick={onSupport} className="lp-btn lp-btn--outline lp-btn--lg">Talk to support</button>
        </>
      )}
    </div>

    <footer className="mt-8 text-center text-xs lp-muted space-y-0.5">
      <p>Checked on {verifiedAt}</p>
      <p>Transaction ID: {reference}</p>
    </footer>
  </motion.main>
);

export default PaymentResultCard;
