import  { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

type Kind = "date" | "datetime-local" | "time";

export interface DateInputChangeEvent {
  target: { value: string; name?: string };
  currentTarget: { value: string; name?: string };
}

export interface DateInputProps {
  type?: Kind;
  value?: string;
  onChange?(e: DateInputChangeEvent): void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  min?: string;
  placeholder?: string;
  "aria-label"?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Custom date / time / date-time picker. Same value formats as the native inputs. */
export default function DateInput({ type = "date", value = "", onChange, className = "", required, disabled, name, min, placeholder, ...rest }: DateInputProps) {
  const [datePart, timePart] = type === "time" ? ["", value] : value.split("T");
  const base = datePart ? new Date(datePart + "T00:00:00") : new Date();
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [h, mi] = (timePart || "").split(":");

  useEffect(() => {
    if (!open) return;
    const r = btn.current!.getBoundingClientRect();
    const w = 300, hgt = 380;
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)),
      top: window.innerHeight - r.bottom < hgt && r.top > hgt ? r.top - hgt - 6 : r.bottom + 6,
    });
    const close = (e: MouseEvent) => { if (!btn.current?.contains(e.target as Node) && !pop.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  const emit = (d: string, t: string) => {
    const v = type === "date" ? d : type === "time" ? t : d ? `${d}T${t || "09:00"}` : "";
    onChange?.({ target: { value: v, name }, currentTarget: { value: v, name } });
  };

  const first = new Date(view.y, view.m, 1);
  const lead = first.getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => (i < lead || i >= lead + days ? null : i - lead + 1));
  const today = iso(new Date());

  const label = !value ? "" : type === "time" ? value
    : new Date(datePart + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) + (type === "datetime-local" && timePart ? `, ${timePart}` : "");
  const Icon = type === "time" ? Clock : CalendarDays;
  const showCal = type !== "time";
  const showTime = type !== "date";

  return (
    <>
      <button ref={btn} type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-label={rest["aria-label"]}
        className={`form-input select-trigger ${className}`} onClick={() => setOpen((o) => !o)}>
        <span className={`truncate ${label ? "" : "text-[var(--color-subtle)]"}`}>{label || placeholder || (type === "time" ? "Pick a time" : "Pick a date")}</span>
        <Icon size={16} className="shrink-0" />
      </button>
      {required && <input tabIndex={-1} aria-hidden className="sr-only" required value={value} onChange={() => {}} />}
      {open && createPortal(
        <div ref={pop} role="dialog" className="picker-popup" style={{ position: "fixed", top: pos.top, left: pos.left }}>
          {showCal && (
            <>
              <div className="flex items-center justify-between mb-2">
                <button type="button" aria-label="Previous month" className="picker-nav" onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }))}><ChevronLeft size={16} /></button>
                <span className="font-semibold text-sm">{MONTHS[view.m]} {view.y}</span>
                <button type="button" aria-label="Next month" className="picker-nav" onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }))}><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] text-[var(--color-muted)] mb-1">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <span key={i} />;
                  const v = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
                  const off = !!min && v < min.slice(0, 10);
                  return (
                    <button type="button" key={i} disabled={off} aria-pressed={v === datePart}
                      className={`picker-day ${v === datePart ? "is-selected" : ""} ${v === today ? "is-today" : ""}`}
                      onClick={() => { emit(v, timePart); if (type === "date") setOpen(false); }}>{d}</button>
                  );
                })}
              </div>
            </>
          )}
          {showTime && (
            <div className={`flex items-center gap-2 ${showCal ? "mt-3 pt-3 border-t border-[var(--color-card-border)]" : ""}`}>
              <Clock size={15} className="text-[var(--color-muted)]" />
              <div className="picker-col" role="listbox" aria-label="Hour">{Array.from({ length: 24 }, (_, i) => pad(i)).map((x) => (
                <button type="button" key={x} className={`picker-cell ${x === h ? "is-selected" : ""}`} onClick={() => emit(datePart, `${x}:${mi || "00"}`)}>{x}</button>))}</div>
              <span>:</span>
              <div className="picker-col" role="listbox" aria-label="Minute">{["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((x) => (
                <button type="button" key={x} className={`picker-cell ${x === mi ? "is-selected" : ""}`} onClick={() => emit(datePart || iso(new Date()), `${h || "09"}:${x}`)}>{x}</button>))}</div>
            </div>
          )}
          <div className="flex justify-between mt-3">
            <button type="button" className="text-xs font-semibold text-[var(--color-muted)]" onClick={() => { emit("", ""); setOpen(false); }}>Clear</button>
            <button type="button" className="text-xs font-semibold text-[var(--color-primary)]" onClick={() => (showCal ? (emit(today, timePart), setView({ y: new Date().getFullYear(), m: new Date().getMonth() })) : emit("", `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`))}>{showCal ? "Today" : "Now"}</button>
            {showTime && <button type="button" className="text-xs font-semibold text-[var(--color-primary)]" onClick={() => setOpen(false)}>Done</button>}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}