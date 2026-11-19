import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type Opt = { value: string; label: React.ReactNode; disabled?: boolean };

export interface SelectChangeEvent {
  target: { value: string; name?: string };
  currentTarget: { value: string; name?: string };
}

/**
 * Drop-in replacement for a native <select>: accepts both standard React ChangeEvent handlers
 * and lightweight `{ target: { value, name } }` handlers.
 */
export interface SelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?(e: SelectChangeEvent): void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  placeholder?: string;
  "aria-label"?: string;
}

const readOptions = (children: React.ReactNode): Opt[] => {
  const out: Opt[] = [];
  React.Children.forEach(children, (c) => {
    if (!React.isValidElement(c)) return;
    const el = c as React.ReactElement<any>;
    if (el.type === React.Fragment) out.push(...readOptions(el.props.children));
    else if (el.type === "option") {
      const label = el.props.children;
      out.push({
        value: String(
          el.props.value ?? (typeof label === "string" ? label : ""),
        ),
        label,
        disabled: el.props.disabled,
      });
    }
  });
  return out;
};

export default function Select({
  value,
  defaultValue,
  onChange,
  className = "",
  children,
  disabled,
  required,
  name,
  id,
  placeholder = "Choose…",
  ...rest
}: SelectProps) {
  const options = useMemo(() => readOptions(children), [children]);
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const current = value !== undefined ? String(value) : inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, up: false });
  const lid = useId();

  const selected = options.find((o) => o.value === current);

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const up = window.innerHeight - r.bottom < 260 && r.top > 260;
    setPos({
      top: up ? r.top - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
      up,
    });
  };

  useEffect(() => {
    if (!open) return;
    place();
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === current),
      ),
    );
    const close = (e: MouseEvent) => {
      if (
        !btn.current?.contains(e.target as Node) &&
        !list.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    const move = () => place();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", move);
    window.addEventListener("scroll", move, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", move);
      window.removeEventListener("scroll", move, true);
    };
  }, [open]); // eslint-disable-line

  const pick = (o: Opt) => {
    if (o.disabled) return;
    if (value === undefined) setInner(o.value);
    onChange?.({
      target: { value: o.value, name },
      currentTarget: { value: o.value, name },
    });
    setOpen(false);
    btn.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      options[active] && pick(options[active]);
    } else if (e.key.length === 1) {
      const i = options.findIndex((o) =>
        String(typeof o.label === "string" ? o.label : o.value)
          .toLowerCase()
          .startsWith(e.key.toLowerCase()),
      );
      if (i >= 0) setActive(i);
    }
  };

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={lid}
        aria-label={rest["aria-label"]}
        disabled={disabled}
        className={`form-input select-trigger ${className}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
      >
        <span
          className={`truncate ${selected && selected.value !== "" ? "" : "text-[var(--color-subtle)]"}`}
        >
          {selected && (selected.value !== "" || !placeholder)
            ? selected.label
            : (selected?.label ?? placeholder)}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          required
          value={current}
          onChange={() => {}}
        />
      )}
      {open &&
        createPortal(
          <ul
            ref={list}
            id={lid}
            role="listbox"
            className="select-popup"
            style={{
              position: "fixed",
              left: pos.left,
              width: pos.width,
              ...(pos.up
                ? { bottom: window.innerHeight - pos.top }
                : { top: pos.top }),
            }}
          >
            {options.map((o, i) => (
              <li
                key={o.value + i}
                data-i={i}
                role="option"
                aria-selected={o.value === current}
                aria-disabled={o.disabled}
                className={`select-option ${i === active ? "is-active" : ""} ${o.value === current ? "is-selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o)}
              >
                <span className="truncate">{o.label}</span>
                {o.value === current && <Check size={15} />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
