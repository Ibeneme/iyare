// src/components/HomeFooter/HomeFooter.tsx
import React, { useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaInstagram,
  FaTwitter,
  FaLinkedin,
  FaFacebook,
  FaWhatsapp,
  FaTelegramPlane,
} from "react-icons/fa";

import { Mail, Phone, MapPin, Globe } from "lucide-react";
import CenteredTextSection from "../CenteredTextSection/CenteredTextSection";
import FloatingWhatsAppButton from "../FloatingWhatsAppButton/FloatingWhatsAppButton";

const HomeFooter: React.FC = () => {
  const location = useLocation();
  const isBlogDetail = matchPath("/blog-details/:id", location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!isBlogDetail && !isAdminRoute && <CenteredTextSection />}
      <FloatingWhatsAppButton />
      <footer className="relative bg-[#023009] text-white overflow-hidden pt-24">
        <div className="container mx-auto px-6 py-16 max-w-7xl relative z-10 ">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Brand & Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-3xl font-black text-[#ffd000]">
                Yare Height Learning Hub
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Made in <strong className="text-[#ffd000]">Nigeria</strong> for
                the world. We bring school home — live classes, homework, exams,
                and friends — all in one app. No traffic. No excuses. Just
                results.
              </p>
              <div className="flex items-center gap-2 text-[#ffd000] text-sm">
                <Globe className="w-4 h-4" />
                <span className="font-bold">yare.ng</span>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h3 className="text-xl font-black text-[#ffd000]">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "About Us", path: "/about-us" },
                  { label: "Subjects", path: "/subjects" },
                  { label: "Pricing", path: "/pricing" },
                  { label: "Careers", path: "/careers" },
                  { label: "Terms and Conditions", path: "/terms" },
                  { label: "Privacy Policy", path: "/policy" },
                ].map((link) => (
                  <li key={link.path}>
                    <a
                      href={link.path}
                      className="text-white/80 hover:text-[#ffd000] transition-colors duration-300 flex items-center gap-2"
                    >
                      <div className="w-1 h-1 bg-[#ffd000] rounded-full"></div>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact & Social */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-xl font-black text-[#ffd000]">Talk to Us</h3>

              <div className="space-y-3 text-sm">
                <a
                  href="mailto:support@yare.ng"
                  className="flex items-center gap-3 text-white/80 hover:text-[#ffd000] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#ffd000]" />
                  support@yare.ng
                </a>
                <a
                  href="https://wa.me/2349012345678"
                  className="flex items-center gap-3 text-white/80 hover:text-[#ffd000] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#ffd000]" />
                  +234 901 234 5678
                </a>
                <div className="flex items-center gap-3 text-white/80">
                  <MapPin className="w-4 h-4 text-[#ffd000]" />
                  Lagos, Nigeria
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-3">
                {[
                  { Icon: FaFacebook, link: "https://facebook.com/yarehub" },
                  { Icon: FaInstagram, link: "https://instagram.com/yarehub" },
                  { Icon: FaTwitter, link: "https://twitter.com/yarehub" },
                  {
                    Icon: FaLinkedin,
                    link: "https://linkedin.com/company/yarehub",
                  },
                  { Icon: FaWhatsapp, link: "https://wa.me/2349012345678" },
                  { Icon: FaTelegramPlane, link: "https://t.me/yarehub" },
                ].map(({ Icon, link }, i) => (
                  <motion.a
                    key={i}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -4, scale: 1.1 }}
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-[#ffd000] hover:text-[#023009] transition-all duration-300 border border-[#ffd000]/30"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 pt-8 border-t border-[#ffd000]/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/60"
          >
            <p>
              &copy; {new Date().getFullYear()}{" "}
              <strong className="text-[#ffd000]">Yare Learning Hub</strong>. All
              rights reserved.
            </p>
            <p>
              Made with <span className="text-[#ffd000]">love</span> by{" "}
              <a
                href="https://www.boringthinkers.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ffd000] font-bold hover:underline hover:text-yellow-300 transition-all"
              >
                Boring Thinkers
              </a>
            </p>
          </motion.div>
        </div>
      </footer>
    </>
  );
};

export default HomeFooter;
