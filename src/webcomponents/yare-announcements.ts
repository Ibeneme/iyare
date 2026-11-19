/**
 * <yare-announcements>: a framework-agnostic custom element that shows the server's
 * top banners, maintenance notices and announcement feed (yare-server /api/announcements).
 *
 *   <yare-announcements api-base="https://api.example.com" token="…" view="banners"></yare-announcements>
 *
 * Attributes
 *   api-base   server origin (required)
 *   token      JWT. With a token it reads /mine (role-filtered); without one /public (login page)
 *   view       "banners" (default): banner + maintenance strips   |   "feed": announcement cards
 *   refresh    polling interval in seconds (default 60; 0 disables)
 * Properties
 *   socket     a socket.io client; refetches on the server's "announcements:changed" event
 * Events (bubbling, composed)
 *   yare-announcements-loaded   detail: { banners, maintenance, announcements }
 *   yare-banner-dismissed       detail: { id }
 *   yare-maintenance            detail: { active: boolean, blocking: boolean }
 * Styling: Shadow DOM. Inherits the page's --lp-* / --color-* custom properties and font,
 * so it follows light/dark automatically. Parts: banner, maintenance, card.
 */

type Severity = "info" | "success" | "warning" | "critical";
interface Item {
  _id: string;
  kind: "announcement" | "maintenance" | "banner";
  title: string;
  body?: string;
  severity?: Severity;
  linkUrl?: string;
  linkLabel?: string;
  dismissible?: boolean;
  pinned?: boolean;
  blocking?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
}
interface Payload { banners: Item[]; maintenance: Item[]; announcements: Item[] }
interface SocketLike { on(ev: string, fn: () => void): unknown; off(ev: string, fn: () => void): unknown }

const COOKIE = "yare_dismissed_banners";
const readDismissed = (): string[] => {
  const m = document.cookie.split("; ").find((c) => c.startsWith(COOKIE + "="));
  if (!m) return [];
  try {
    return JSON.parse(decodeURIComponent(m.split("=")[1])) as string[];
  } catch {
    return [];
  }
};
const writeDismissed = (ids: string[]) => {
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(ids.slice(-50)))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`;
};

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const safeUrl = (u?: string) => (u && /^(https?:\/\/|\/)/i.test(u) ? u : "");

const ICON: Record<Severity, string> = {
  info: "M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  success: "m8 12 3 3 5-6M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  warning: "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  critical: "M12 8v5m0 3h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
};

const STYLE = `
:host { display: block; font-family: inherit; }
* { box-sizing: border-box; }
.stack { display: grid; gap: 0; }
.strip {
  --bg: var(--lp-green-soft, #e4e9d1); --fg: var(--lp-green-deep, #2d3719); --accent: var(--lp-green, #4b5a2a);
  display: flex; align-items: center; gap: .75rem; padding: .6rem 1rem; background: var(--bg); color: var(--fg);
  font-size: .875rem; line-height: 1.35; border-bottom: 1px solid color-mix(in srgb, var(--fg) 12%, transparent);
}
.strip[data-sev="success"] { --bg: var(--lp-green-soft, #e4e9d1); --fg: #2d3719; }
.strip[data-sev="warning"] { --bg: var(--lp-yellow, #f6c915); --fg: var(--lp-on-yellow, #2d3719); }
.strip[data-sev="critical"] { --bg: #b3261e; --fg: #fff; }
.strip[data-sev="info"] { --bg: var(--lp-green-deep, #2d3719); --fg: #fff; }
.strip.maint { --bg: var(--lp-yellow, #f6c915); --fg: var(--lp-on-yellow, #2d3719); }
.strip.maint.block { --bg: #b3261e; --fg: #fff; }
.ico { flex: none; width: 1.25rem; height: 1.25rem; }
.txt { flex: 1; min-width: 0; }
.txt b { font-weight: 700; }
.txt span { opacity: .9; margin-left: .35rem; }
a.cta { flex: none; color: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
button.x {
  flex: none; display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border-radius: 999px; border: 0;
  background: color-mix(in srgb, currentColor 14%, transparent); color: inherit; cursor: pointer;
}
button.x:hover { background: color-mix(in srgb, currentColor 26%, transparent); }
button.x:focus-visible, a.cta:focus-visible { outline: 3px solid var(--lp-yellow, #f6c915); outline-offset: 2px; }
.feed { display: grid; gap: .85rem; }
.card {
  background: var(--lp-surface, #fff); color: var(--lp-ink, #1d2414); border: 1px solid var(--lp-line, #e7e4d2);
  border-radius: 1.4rem; padding: 1.1rem 1.25rem;
}
.card.pin { border-color: var(--lp-yellow, #f6c915); box-shadow: 0 0 0 3px var(--lp-yellow-soft, #fdf0b4); }
.card h3 { margin: 0 0 .25rem; font-size: 1rem; font-weight: 700; letter-spacing: -.01em; }
.card p { margin: 0; color: var(--lp-muted, #5f6853); font-size: .9rem; white-space: pre-wrap; }
.meta { display: flex; gap: .5rem; align-items: center; margin-bottom: .5rem; font-size: .72rem; color: var(--lp-muted, #5f6853); }
.pill { background: var(--lp-yellow-soft, #fdf0b4); color: var(--lp-yellow-text, #8a6a00); border-radius: 999px; padding: .1rem .6rem; font-weight: 700; }
.empty { color: var(--lp-muted, #5f6853); font-size: .9rem; padding: 1rem 0; text-align: center; }
@media (max-width: 520px) { .strip { align-items: flex-start; } }
`;

export class YareAnnouncements extends HTMLElement {
  static observedAttributes = ["api-base", "token", "view", "refresh"];

  private root: ShadowRoot;
  private data: Payload = { banners: [], maintenance: [], announcements: [] };
  private dismissed = new Set<string>(readDismissed());
  private timer: number | undefined;
  private inflight: AbortController | null = null;
  private _socket: SocketLike | null = null;
  private onChanged = () => void this.load();
  private onMaintenanceEvent = (e: Event) => {
    const d = (e as CustomEvent).detail || {};
    // The API answered 503: show a blocking strip even if our own fetch is blocked too.
    this.data.maintenance = [{ _id: "live-503", kind: "maintenance", title: d.title || "Maintenance in progress", body: d.message, blocking: true }];
    this.render();
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  get socket(): SocketLike | null {
    return this._socket;
  }
  set socket(s: SocketLike | null) {
    this._socket?.off("announcements:changed", this.onChanged);
    this._socket = s;
    s?.on("announcements:changed", this.onChanged);
  }

  connectedCallback() {
    window.addEventListener("yare:maintenance", this.onMaintenanceEvent);
    void this.load();
    this.schedule();
  }
  disconnectedCallback() {
    window.removeEventListener("yare:maintenance", this.onMaintenanceEvent);
    window.clearInterval(this.timer);
    this.inflight?.abort();
    this._socket?.off("announcements:changed", this.onChanged);
  }
  attributeChangedCallback(name: string, oldV: string | null, newV: string | null) {
    if (oldV === newV || !this.isConnected) return;
    if (name === "refresh") this.schedule();
    else if (name === "view") this.render();
    else void this.load();
  }

  /** Re-fetch now (also callable from outside: `el.refresh()`). */
  refresh() {
    return this.load();
  }

  private schedule() {
    window.clearInterval(this.timer);
    const s = Number(this.getAttribute("refresh") ?? 60);
    if (s > 0) this.timer = window.setInterval(() => void this.load(), s * 1000);
  }

  private async load() {
    const base = (this.getAttribute("api-base") || "").replace(/\/$/, "");
    if (!base) return;
    const token = this.getAttribute("token");
    this.inflight?.abort();
    this.inflight = new AbortController();
    try {
      const res = await fetch(`${base}/api/announcements/${token ? "mine" : "public"}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: this.inflight.signal,
      });
      if (!res.ok) return; // a 503 is handled by the yare:maintenance event; other errors: keep what we have
      const json = (await res.json()) as { data: Partial<Payload> };
      this.data = { banners: [], maintenance: [], announcements: [], ...json.data };
      this.render();
      this.emit("yare-announcements-loaded", this.data);
      const blocking = this.data.maintenance.some((m) => m.blocking);
      this.emit("yare-maintenance", { active: this.data.maintenance.length > 0, blocking });
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.warn("[yare-announcements]", (e as Error).message);
    }
  }

  private emit(name: string, detail: unknown) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private dismiss(id: string) {
    this.dismissed.add(id);
    writeDismissed([...this.dismissed]);
    this.emit("yare-banner-dismissed", { id });
    this.render();
  }

  private strip(i: Item, cls: string, sev: Severity) {
    const url = safeUrl(i.linkUrl);
    const dismissible = i.dismissible !== false && !i.blocking;
    return `<div class="strip ${cls}" data-sev="${sev}" part="${cls.includes("maint") ? "maintenance" : "banner"}" role="${sev === "critical" || i.blocking ? "alert" : "status"}">
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[sev]}"/></svg>
      <div class="txt"><b>${esc(i.title)}</b>${i.body ? `<span>${esc(i.body)}</span>` : ""}</div>
      ${url ? `<a class="cta" href="${esc(url)}">${esc(i.linkLabel || "Learn more")}</a>` : ""}
      ${dismissible ? `<button class="x" data-id="${esc(i._id)}" aria-label="Dismiss"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>` : ""}
    </div>`;
  }

  private render() {
    const view = this.getAttribute("view") === "feed" ? "feed" : "banners";
    let html = `<style>${STYLE}</style>`;
    if (view === "banners") {
      const maint = this.data.maintenance.map((m) => this.strip(m, `maint${m.blocking ? " block" : ""}`, m.blocking ? "critical" : "warning"));
      const banners = this.data.banners.filter((b) => !this.dismissed.has(b._id)).map((b) => this.strip(b, "", b.severity || "info"));
      html += `<div class="stack">${maint.join("")}${banners.join("")}</div>`;
    } else {
      const items = [...this.data.announcements].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
      html += items.length
        ? `<div class="feed">${items
            .map(
              (a) => `<article class="card${a.pinned ? " pin" : ""}" part="card"><div class="meta">${a.pinned ? '<span class="pill">Pinned</span>' : ""}<span>${a.createdAt ? esc(new Date(a.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })) : ""}</span></div><h3>${esc(a.title)}</h3>${a.body ? `<p>${esc(a.body)}</p>` : ""}</article>`
            )
            .join("")}</div>`
        : `<p class="empty">No announcements right now.</p>`;
    }
    this.root.innerHTML = html;
    this.root.querySelectorAll<HTMLButtonElement>("button.x").forEach((b) => b.addEventListener("click", () => this.dismiss(b.dataset.id!)));
  }
}

export const defineYareAnnouncements = () => {
  if (!customElements.get("yare-announcements")) customElements.define("yare-announcements", YareAnnouncements);
};
