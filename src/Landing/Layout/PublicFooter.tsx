import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaTelegramPlane, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { Mail, MapPin, Phone } from "lucide-react";
import ContactUsSection from "../Home/ContactUsSection";
import WhatsAppButton from "./WhatsAppButton";
import { LogoMark } from "../Shared/index";
import { PATHS } from "../../routes/paths";

const EXPLORE = [
  { label: "Subjects", to: PATHS.subjectsOverview },
  { label: "About us", to: PATHS.about },
  { label: "Pricing", to: PATHS.pricing },
  { label: "Careers", to: PATHS.careers },
];
const LEGAL = [
  { label: "Terms & conditions", to: PATHS.terms },
  { label: "Privacy policy", to: PATHS.privacy },
  { label: "Staff sign in", to: PATHS.adminSignIn },
];
const SOCIAL = [
  { Icon: FaFacebook, href: "https://facebook.com/yarehub", label: "Facebook" },
  { Icon: FaInstagram, href: "https://instagram.com/yarehub", label: "Instagram" },
  { Icon: FaTwitter, href: "https://twitter.com/yarehub", label: "Twitter" },
  { Icon: FaLinkedin, href: "https://linkedin.com/company/yarehub", label: "LinkedIn" },
  { Icon: FaWhatsapp, href: "https://wa.me/2349012345678", label: "WhatsApp" },
  { Icon: FaTelegramPlane, href: "https://t.me/yarehub", label: "Telegram" },
];

/** Contact call-to-action, then the army-green footer card. */
const PublicFooter: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <ContactUsSection />
      <WhatsAppButton />

      <footer className="px-3 sm:px-6 pb-5" aria-label="Site footer">
        <div className="mx-auto max-w-6xl rounded-[2rem] px-6 sm:px-10 py-12" style={{ background: "var(--lp-green-deep)", color: "#fff" }}>
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <LogoMark size={44} />
                <span className="text-xl font-semibold tracking-tight">Yare Height</span>
              </div>
              <p className="text-sm leading-relaxed text-white/75 max-w-xs">
                Proudly built in Nigeria. Live lessons, homework and progress reports in one friendly place, so learning
                never has to wait for the school run.
              </p>
            </div>

            <nav aria-label="Explore">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--lp-yellow)" }}>Explore</h3>
              <ul className="space-y-2.5 text-sm">
                {EXPLORE.map((l) => (
                  <li key={l.to}><Link to={l.to} className="text-white/75 hover:text-[var(--lp-yellow)] transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--lp-yellow)" }}>Good to know</h3>
              <ul className="space-y-2.5 text-sm">
                {LEGAL.map((l) => (
                  <li key={l.to}><Link to={l.to} className="text-white/75 hover:text-[var(--lp-yellow)] transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </nav>

            <div>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--lp-yellow)" }}>Say hello</h3>
              <ul className="space-y-3 text-sm text-white/75">
                <li><a href="mailto:support@yare.ng" className="flex items-center gap-2.5 hover:text-[var(--lp-yellow)]"><Mail className="w-4 h-4" style={{ color: "var(--lp-yellow)" }} /> support@yare.ng</a></li>
                <li><a href="https://wa.me/2349012345678" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-[var(--lp-yellow)]"><Phone className="w-4 h-4" style={{ color: "var(--lp-yellow)" }} /> +234 901 234 5678</a></li>
                <li className="flex items-center gap-2.5"><MapPin className="w-4 h-4" style={{ color: "var(--lp-yellow)" }} /> Port Harcourt, Nigeria</li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-5">
                {SOCIAL.map(({ Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-[var(--lp-yellow)] hover:text-[var(--lp-green-deep)] transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <p>© {new Date().getFullYear()} Yare Height Learning Hub. All rights reserved.</p>
            <p>
              Crafted by{" "}
              <a href="https://www.boringthinkers.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: "var(--lp-yellow)" }}>
                Boring Thinkers
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PublicFooter;
