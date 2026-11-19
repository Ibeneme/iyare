import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";
import { LogoMark, SectionLabel } from "../Shared/index";
import NotFoundIllustration from "./NotFoundIllustration";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const goHome = () => navigate("/");
  const goBack = () => navigate(-1);

  return (
    <>
      <header className="lp-container py-5">
        <Link to="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight" aria-label="Yare Height home">
          <LogoMark size={40} />
          <span>Yare Height</span>
        </Link>
      </header>

      <main className="flex-1 grid place-items-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-lg w-full"
        >
          <NotFoundIllustration />
          <h1 className="sr-only">404</h1>

          <div className="mt-8">
            <SectionLabel>Page not found</SectionLabel>
          </div>
          <h2 className="lp-h2 mt-5" style={{ fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)" }}>
            Looks like this page wandered off.
          </h2>
          <p className="lp-lead mt-4">
            The link may be old or mistyped. No worries — even the best explorers take a wrong turn now and then.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
            <button onClick={goHome} className="lp-btn lp-btn--dark lp-btn--lg">
              <Home className="w-4 h-4" />
              Take me home
            </button>
            <button onClick={goBack} className="lp-btn lp-btn--outline lp-btn--lg group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
              Go back
            </button>
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default NotFound;
