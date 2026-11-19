import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Lock, MessageCircle, ShieldCheck, Video, Bell, CalendarDays } from "lucide-react";
import { BentoTile, PersonAvatar, SectionLabel } from "../Shared/index";
import { PATHS } from "../../routes/paths";

const NODES = [
  { Icon: BookOpen, x: 14, y: 22 }, { Icon: Video, x: 50, y: 8 }, { Icon: MessageCircle, x: 86, y: 22 },
  { Icon: Bell, x: 14, y: 78 }, { Icon: BarChart3, x: 50, y: 92 }, { Icon: Lock, x: 86, y: 78 },
];

/** Pastel bento grid showing the platform's four strengths. */
const FeaturesSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section aria-labelledby="features-title" className="lp-section">
      <div className="lp-container">
        <div className="text-center">
          <SectionLabel dot tone="green">Features</SectionLabel>
          <h2 id="features-title" className="lp-h2 mt-5">
            Everything your child needs,
            <br />
            <span className="lp-gradient-text">all in one place</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {/* 1 — Start learning */}
          <BentoTile tone="green" className="min-h-[22rem] flex flex-col justify-end">
            <span className="lp-wordmark" style={{ left: "-0.2rem", top: "0.4rem", fontSize: "clamp(6rem, 17vw, 11rem)" }} aria-hidden="true">YARE</span>
            <div className="relative">
              <h3 className="lp-h3" style={{ fontSize: "1.9rem" }}>Ready when you are</h3>
              <p className="mt-2 text-sm lp-muted max-w-xs">Sign up in minutes and join your first lesson the same day.</p>
              <button onClick={() => navigate(PATHS.register)} className="lp-btn lp-btn--dark mt-5">Start learning</button>
            </div>
          </BentoTile>

          {/* 2 — Live classes */}
          <BentoTile tone="sand" className="min-h-[22rem]">
            <div className="grid sm:grid-cols-[1fr_1.1fr] gap-6 h-full">
              <div>
                <h3 className="lp-h3">Live classes</h3>
                <p className="mt-2 text-sm lp-muted">Join small, friendly groups with a teacher who knows your child by name.</p>
              </div>
              <div className="relative min-h-[14rem]">
                <div className="lp-float absolute right-0 top-0 w-[88%] rounded-[1.6rem] p-4" style={{ borderWidth: 4, borderColor: "var(--lp-green-deep)" }}>
                  <p className="text-xs lp-muted">Next class</p>
                  <p className="font-semibold mt-0.5">Maths · 10:00 am</p>
                  <div className="mt-3 space-y-2">
                    {["English", "Science"].map((s) => (
                      <div key={s} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--lp-green-soft)" }}>
                        <CalendarDays size={14} /> <span className="text-xs font-medium">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lp-float absolute left-0 bottom-0 w-[70%] p-3 flex items-center gap-3">
                  <PersonAvatar variant={2} size={38} />
                  <div><p className="text-xs lp-muted">Teacher</p><p className="text-sm font-semibold">Mrs. Adeyemi</p></div>
                </div>
              </div>
            </div>
          </BentoTile>

          {/* 3 — Progress */}
          <BentoTile tone="yellow" className="min-h-[22rem]">
            <h3 className="lp-h3">Progress you can see</h3>
            <p className="mt-2 text-sm lp-muted max-w-xs">Monthly reports and quick recaps keep you in the loop.</p>
            <div className="mt-6 space-y-3">
              <div className="lp-float p-4">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold">Monthly goal</span><span className="lp-muted">78%</span></div>
                <div className="mt-3 h-2.5 rounded-full" style={{ background: "var(--lp-green-soft)" }}>
                  <div className="h-full rounded-full" style={{ width: "78%", background: "var(--lp-green)" }} />
                </div>
              </div>
              <div className="lp-float p-3 flex items-center gap-3 ml-6">
                <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: "var(--lp-yellow)", color: "var(--lp-on-yellow)" }}><BarChart3 size={18} /></span>
                <div className="flex-1"><p className="text-sm font-semibold">English report ready</p><p className="text-xs lp-muted">Grade up from B to A−</p></div>
              </div>
            </div>
          </BentoTile>

          {/* 4 — Safe and secure */}
          <BentoTile tone="mint" className="min-h-[22rem]">
            <h3 className="lp-h3">Safe and secure</h3>
            <p className="mt-2 text-sm lp-muted max-w-xs">Private classrooms and verified teachers protect every learner.</p>
            <div className="relative mx-auto mt-4 h-52 max-w-sm">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {NODES.map((n, i) => (<line key={i} x1="50" y1="50" x2={n.x} y2={n.y} stroke="var(--lp-green-mid)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeOpacity="0.6" />))}
              </svg>
              <div className="lp-float absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 px-3 py-4 text-center" style={{ background: "var(--lp-green-deep)", color: "#fff", borderColor: "transparent" }}>
                <ShieldCheck className="mx-auto" size={22} style={{ color: "var(--lp-yellow)" }} />
                <p className="text-xs mt-1.5 font-semibold">Protected</p>
              </div>
              {NODES.map(({ Icon, x, y }, i) => (
                <span key={i} className="absolute w-9 h-9 -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center lp-float" style={{ left: `${x}%`, top: `${y}%` }}>
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </BentoTile>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
