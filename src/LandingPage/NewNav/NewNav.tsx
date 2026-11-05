// src/components/Navbar/Navbar.tsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  BookOpen,
  FileText,
  Lock,
  Home,
  Shield,
  ArrowRight,
  Users,
  CreditCard,
  Briefcase,
} from "lucide-react";
import yare from "../../../src/assets/images/logo.jpg";

const ACTIVE_GREEN = "text-green-600";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Token Detection
  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  const navItems = [
    {
      to: "/",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
    },
    {
      to: "/subjects",
      label: "Subjects",
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      to: "/about-us",
      label: "About Us",
      icon: <Users className="w-5 h-5" />,
    },
    {
      to: "/pricing",
      label: "Pricing",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      to: "/careers",
      label: "Careers",
      icon: <Briefcase className="w-5 h-5" />,
    },
    { to: "/terms", label: "Terms", icon: <FileText className="w-5 h-5" /> },
    { to: "/policy", label: "Privacy", icon: <Lock className="w-5 h-5" /> },
    {
      to: "/admin-sign-in",
      label: "Admin",
      icon: <Shield className="w-5 h-5" />,
    },
  ];

  const handleNavigation = (to: string) => {
    navigate(to);
    closeMenu();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white border-b-4 border-[#ffd000] z-50 shadow-lg">
        <div className="container mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation("/")}
            className="cursor-pointer flex items-center gap-3"
          >
            <div className="w-11 h-11 bg-[#ffd000] rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={yare}
                alt="Yare Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? `${ACTIVE_GREEN} scale-110`
                      : "text-gray-600 hover:text-[#023009]"
                  }`}
                >
                  <span className={isActive ? ACTIVE_GREEN : ""}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Desktop Buttons */}
            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => handleNavigation("/auth-sign-in")}
                    className="px-6 py-2.5 bg-[#ffd000] text-[#023009] rounded-full font-bold text-sm hover:bg-[#e6c200] transition-all border-2 border-[#ffd000]"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => handleNavigation("/register")}
                    className="px-6 py-2.5 bg-[#023009] text-white rounded-full font-bold text-sm hover:bg-[#012009] transition-all flex items-center gap-2"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleNavigation("/subject-manager")}
                  className="px-6 py-2.5 bg-[#023009] text-white rounded-full font-bold text-sm hover:bg-[#012009] transition-all flex items-center gap-2"
                >
                  Proceed to Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={toggleMenu}
            className="lg:hidden text-[#023009] p-2 rounded-lg hover:bg-[#ffd000]/20 transition"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 lg:hidden"
              onClick={closeMenu}
            />

            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-16 left-0 right-0 bg-white z-50 lg:hidden overflow-hidden border-b-4 border-[#ffd000]"
            >
              <div className="px-6 py-8 space-y-3">
                {navItems.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <motion.button
                      key={item.to}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNavigation(item.to)}
                      className={`w-full flex items-center justify-between py-4 px-5 text-left text-lg font-bold transition-all rounded-xl ${
                        active
                          ? "bg-[#ffd000] text-[#023009]"
                          : "text-[#023009]/80 hover:bg-[#ffd000]/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={active ? ACTIVE_GREEN : ""}>
                          {item.icon}
                        </span>
                        <span className={active ? ACTIVE_GREEN : ""}>
                          {item.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}

                {/* Mobile Buttons */}
                <div className="pt-6 space-y-4 border-t-2 border-gray-100">
                  {!isLoggedIn ? (
                    <>
                      <button
                        onClick={() => handleNavigation("/auth-sign-in")}
                        className="w-full py-4 bg-[#ffd000] text-[#023009] rounded-2xl font-bold text-lg hover:bg-[#e6c200] transition-all shadow-md"
                      >
                        Sign In
                      </button>

                      <button
                        onClick={() => handleNavigation("/register")}
                        className="w-full py-4 bg-[#023009] text-white rounded-2xl font-bold text-lg hover:bg-[#012009] transition-all flex items-center justify-center gap-3 shadow-md"
                      >
                        Get Started <ArrowRight className="w-6 h-6" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNavigation("/subject-manager")}
                      className="w-full py-4 bg-[#023009] text-white rounded-2xl font-bold text-lg hover:bg-[#012009] transition-all flex items-center justify-center gap-3 shadow-md"
                    >
                      Proceed to Dashboard <ArrowRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="h-20 lg:h-24" />
    </>
  );
};

export default Navbar;
