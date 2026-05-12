// ui.jsx — icons, primitives, shared components
// All inline SVG icons (24x24 viewbox, stroke-based, currentColor)

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────
const _stroke = {
  fill: "none", stroke: "currentColor",
  strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round",
};
const Icon = ({ size = 16, children, style, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0, ...style }} {...rest}>
    <g {..._stroke}>{children}</g>
  </svg>
);

const I = {
  Logo: (p) => (
    <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} style={{ display: "block", ...p.style }}>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#2ECC71" />
      <path d="M7 8.5v7M7 12h4.5M11.5 8.5L15.5 12l-4 3.5" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Dashboard: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></Icon>,
  Sync: (p) => <Icon {...p}><path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5M20 4v4.5h-4.5" /><path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5M4 20v-4.5h4.5" /></Icon>,
  Team: (p) => <Icon {...p}><circle cx="9" cy="9" r="3.5" /><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" /><circle cx="17" cy="8" r="2.5" /><path d="M16 14c2.5.3 5 1.8 5 5" /></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="2.8" /><path d="M19.4 14.6a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>,
  Billing: (p) => <Icon {...p}><rect x="2.5" y="6" width="19" height="13" rx="2.5" /><path d="M2.5 10.5h19M6 15.5h4" /></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>,
  Check: (p) => <Icon {...p}><path d="M4.5 12.5l5 5 10-11" /></Icon>,
  X: (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15z" /><path d="M10 21h4" /></Icon>,
  Arrow: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>,
  ArrowLeft: (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>,
  ArrowsLR: (p) => <Icon {...p}><path d="M7 7l-4 5 4 5M3 12h18M17 7l4 5-4 5" /></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Icon>,
  EyeOff: (p) => <Icon {...p}><path d="M3 3l18 18M10.5 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.2 3.9M6.5 8.5A14 14 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>,
  Trash: (p) => <Icon {...p}><path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13M10 11v6M14 11v6" /></Icon>,
  Edit: (p) => <Icon {...p}><path d="M14 4l6 6-11 11H3v-6L14 4z" /></Icon>,
  Copy: (p) => <Icon {...p}><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2.5" /></Icon>,
  Activity: (p) => <Icon {...p}><path d="M3 12h4l3-8 4 16 3-8h4" /></Icon>,
  Filter: (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" /></Icon>,
  Sparkles: (p) => <Icon {...p}><path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" /></Icon>,
  Zap: (p) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></Icon>,
  Building: (p) => <Icon {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-4h4v4" /></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>,
  Shield: (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9.5-4.5-1-8-4.5-8-9.5V6l8-3z" /></Icon>,
  Tag: (p) => <Icon {...p}><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="8" cy="8" r="1.4" fill="currentColor" /></Icon>,
  More: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></Icon>,
  Drag: (p) => <Icon {...p}><circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" /></Icon>,
  Pause: (p) => <Icon {...p}><rect x="7" y="5" width="3" height="14" rx="1" /><rect x="14" y="5" width="3" height="14" rx="1" /></Icon>,
  Play: (p) => <Icon {...p}><path d="M7 5l12 7-12 7V5z" /></Icon>,
  Link: (p) => <Icon {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Icon>,
  Unlink: (p) => <Icon {...p}><path d="M9.5 14.5L5 19M14.5 9.5L19 5M10 14a4 4 0 0 0 5.7 0l1-1M14 10a4 4 0 0 0-5.7 0l-1 1M3 12h2M12 3v2M19 12h2M12 19v2" /></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" /></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></Icon>,
  Warning: (p) => <Icon {...p}><path d="M12 3L2 20h20L12 3zM12 10v5M12 17v.5" /></Icon>,
  ExtLink: (p) => <Icon {...p}><path d="M14 4h6v6M20 4l-8 8M10 5H5v14h14v-5" /></Icon>,
  Switch: (p) => <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="6" /><circle cx="16" cy="12" r="3.5" fill="currentColor" /></Icon>,
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></Icon>,
};

// Provider mark SVGs
const Provider = {
  Google: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <path fill="#4285F4" d="M22 12.2c0-.8-.1-1.6-.2-2.3H12v4.5h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.9z" />
      <path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22z" />
      <path fill="#FBBC04" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9.8l3.5-2.7z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 12 2 10 10 0 0 0 2.7 7.1l3.5 2.7c.8-2.5 3.1-4 5.8-4z" />
    </svg>
  ),
  Microsoft: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block", flexShrink: 0 }}>
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────
function Avatar({ name = "?", color, size = 28, src }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const bg = color || pickColor(name);
  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      fontSize: size * 0.42, fontWeight: 600,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, letterSpacing: "-0.02em",
    }}>{initials}</div>
  );
}

function pickColor(seed) {
  const palette = ["#16a34a", "#4f78e8", "#7c5cd9", "#2eaa9e", "#a45a8b", "#5b6770", "#cc7a17", "#dc6c9b"];
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

// ─────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, footer, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fade-in 0.18s ease",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 64px)",
          background: "var(--panel)", border: "0.5px solid var(--border-hi)",
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
        {title && (
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid var(--divider)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
            <button className="iconbtn" onClick={onClose}><I.X size={14} /></button>
          </div>
        )}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>{children}</div>
        {footer && (
          <div style={{ padding: "12px 20px", borderTop: "0.5px solid var(--divider)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Segmented control
// ─────────────────────────────────────────────────────────────────
function Segmented({ value, onChange, options, size = "md" }) {
  const h = size === "sm" ? 26 : 32;
  return (
    <div style={{
      display: "inline-flex", padding: 2, gap: 2,
      background: "var(--surface)", border: "0.5px solid var(--border)",
      borderRadius: 8, height: h,
    }}>
      {options.map((opt) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const icon = typeof opt === "object" ? opt.icon : null;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{
              height: h - 4, padding: "0 10px", borderRadius: 6,
              fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 500,
              display: "inline-flex", alignItems: "center", gap: 5,
              background: active ? "var(--bg)" : "transparent",
              color: active ? "var(--text)" : "var(--dim)",
              border: active ? "0.5px solid var(--border-hi)" : "0.5px solid transparent",
              transition: "all 0.12s",
            }}>{icon}{label}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────
function Tabs({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid var(--divider)", marginBottom: 16 }}>
      {options.map((opt) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        const active = v === value;
        return (
          <button key={v} onClick={() => onChange(v)}
            style={{
              padding: "8px 12px", marginBottom: -0.5,
              fontSize: 13, fontWeight: 500,
              color: active ? "var(--text)" : "var(--dim)",
              borderBottom: active ? "1.5px solid var(--accent)" : "1.5px solid transparent",
              transition: "color 0.12s, border-color 0.12s",
            }}>{label}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────
function Empty({ icon, title, body, action }) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      {icon && <div style={{ color: "var(--muted)", marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 15, fontWeight: 500 }}>{title}</div>
      {body && <div className="dim" style={{ fontSize: 13, maxWidth: 380, lineHeight: 1.5 }}>{body}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Toast (lightweight)
// ─────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", gap: 8, zIndex: 300,
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            background: "var(--surface-hi)", border: "0.5px solid var(--border-hi)",
            color: "var(--text)", fontSize: 13, padding: "10px 14px",
            borderRadius: 10, boxShadow: "var(--shadow-pop)",
            display: "flex", alignItems: "center", gap: 8,
            animation: "fade-in 0.2s ease", pointerEvents: "auto",
            minWidth: 220,
          }}>
            {t.kind === "ok" && <span style={{ color: "var(--ok)" }}><I.Check size={14} /></span>}
            {t.kind === "info" && <span style={{ color: "var(--accent)" }}><I.Sparkles size={14} /></span>}
            {t.kind === "warn" && <span style={{ color: "var(--warn)" }}><I.Warning size={14} /></span>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ─────────────────────────────────────────────────────────────────
// Color swatch picker
// ─────────────────────────────────────────────────────────────────
const CAL_COLORS = [
  { id: "tomato",  hex: "#e25c5c", name: "Tomato" },
  { id: "tangerine", hex: "#f08a3c", name: "Tangerine" },
  { id: "sand",    hex: "#d9a86c", name: "Sand" },
  { id: "banana",  hex: "#ecc94b", name: "Banana" },
  { id: "sage",    hex: "#7eb069", name: "Sage" },
  { id: "basil",   hex: "#2f9e6a", name: "Basil" },
  { id: "lagoon",  hex: "#3da5b0", name: "Lagoon" },
  { id: "sky",     hex: "#5ba6f0", name: "Sky" },
  { id: "blueberry", hex: "#4f78e8", name: "Blueberry" },
  { id: "lavender", hex: "#9783e3", name: "Lavender" },
  { id: "grape",   hex: "#a45fc6", name: "Grape" },
  { id: "flamingo", hex: "#dc6c9b", name: "Flamingo" },
  { id: "graphite", hex: "#6c727a", name: "Graphite" },
];
function colorByHex(hex) { return CAL_COLORS.find(c => c.hex === hex) || CAL_COLORS[0]; }

function ColorSwatch({ value, onChange, size = 16 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: size, height: size, borderRadius: 4,
          background: value, border: "0.5px solid rgba(255,255,255,0.18)",
          boxShadow: "0 0 0 0.5px rgba(0,0,0,0.3) inset",
        }} />
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30,
          background: "var(--panel)", border: "0.5px solid var(--border-hi)",
          borderRadius: 10, padding: 10, boxShadow: "var(--shadow-pop)",
          display: "grid", gridTemplateColumns: "repeat(7, 18px)", gap: 8,
        }}>
          {CAL_COLORS.map(c => (
            <button key={c.id} title={c.name}
              onClick={() => { onChange(c.hex); setOpen(false); }}
              style={{
                width: 18, height: 18, borderRadius: 5, background: c.hex,
                border: c.hex === value ? "2px solid var(--text)" : "0.5px solid rgba(255,255,255,0.1)",
                boxShadow: "0 0 0 0.5px rgba(0,0,0,0.3) inset",
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page header
// ─────────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      padding: "16px 32px 12px", display: "flex", alignItems: "flex-start", gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1 }}>{title}</h1>
        {subtitle && <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// Expose to other Babel scripts
Object.assign(window, {
  I, Provider, Icon,
  Avatar, Modal, Segmented, Tabs, Empty,
  ToastProvider, useToast,
  ColorSwatch, CAL_COLORS, colorByHex,
  PageHeader,
});
