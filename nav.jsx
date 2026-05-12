// nav.jsx — Sidebar, Topbar, OrgSwitcher

const { useState: useStateN, useEffect: useEffectN, useRef: useRefN } = React;

function Sidebar({ route, onNav }) {
  const { state } = useStore();
  const items = [
    { id: "dashboard", label: "Dashboard", icon: <I.Dashboard size={16} /> },
    { id: "calendars", label: "Calendars", icon: <I.Calendar size={16} /> },
    { id: "sync", label: "Sync flows", icon: <I.Sync size={16} />, badge: state.flows.filter(f => !f.paused).length },
    { id: "team", label: "Team", icon: <I.Team size={16} /> },
    { id: "settings", label: "Settings", icon: <I.Settings size={16} /> },
    { id: "billing", label: "Billing", icon: <I.Billing size={16} /> },
  ];

  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      background: "var(--bg-1)",
      borderRight: "0.5px solid var(--divider)",
      padding: "12px 10px",
      gap: 4,
      height: "100%",
      overflow: "hidden",
    }}>
      {/* Brand mark */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 8px 20px", margin: "0 2px",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "var(--text)", color: "var(--bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11.5, fontWeight: 700, letterSpacing: "-0.03em",
        }}>K</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em" }}>EinKal</div>
      </div>

      {/* Quick action */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px", borderRadius: 7,
              fontSize: 13, fontWeight: 450,
              color: route === it.id ? "var(--text)" : "var(--text-2)",
              background: route === it.id ? "var(--hover)" : "transparent",
              transition: "background 0.1s, color 0.1s",
            }}
            onMouseEnter={(e) => { if (route !== it.id) e.currentTarget.style.background = "color-mix(in oklab, var(--hover) 50%, transparent)"; }}
            onMouseLeave={(e) => { if (route !== it.id) e.currentTarget.style.background = "transparent"; }}>
            <span style={{ color: route === it.id ? "var(--accent)" : "var(--dim)" }}>{it.icon}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{it.label}</span>
            {it.badge != null && (
              <span style={{
                fontSize: 10.5, fontWeight: 500, fontFamily: "var(--font-mono)",
                background: "var(--surface-hi)", color: "var(--text-2)",
                padding: "1px 6px", borderRadius: 999,
              }}>{it.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Status card */}
      <div style={{
        margin: "0 4px 4px", padding: "10px 12px",
        background: "var(--surface)", border: "0.5px solid var(--border)",
        borderRadius: 9,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span className="pulse" />
          <span style={{ fontSize: 11.5, fontWeight: 500 }}>All syncs running</span>
        </div>
        <div className="dim" style={{ fontSize: 11, lineHeight: 1.45 }}>
          {state.flows.filter(f => !f.paused).length} active flows · last check 12s ago
        </div>
      </div>

      <UserChip />
    </aside>
  );
}

function OrgSwitcher() {
  const [open, setOpen] = useStateN(false);
  const ref = useRefN(null);
  const { state } = useStore();

  useEffectN(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", margin: "0 4px 4px" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 9,
          padding: "8px 9px", borderRadius: 8,
          background: open ? "var(--hover)" : "transparent",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "color-mix(in oklab, var(--hover) 50%, transparent)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: "var(--accent)",
          color: "var(--ink-on-accent)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em",
        }}>{state.org.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{state.org.name}</div>
          <div className="dim" style={{ fontSize: 10.5, lineHeight: 1.2 }}>{state.org.plan} · {state.org.seatsUsed}/{state.org.seats}</div>
        </div>
        <I.ChevronDown size={13} style={{ color: "var(--dim)" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--panel)", border: "0.5px solid var(--border-hi)",
          borderRadius: 9, boxShadow: "var(--shadow-pop)",
          padding: 5, zIndex: 50,
        }}>
          <OrgRow name={state.org.name} sub={`${state.org.seatsUsed} members`} active />
          <OrgRow name="Side Hustle Co." sub="Pro · 1 member" />
          <div className="hr" style={{ margin: "5px 0" }} />
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", width: "100%", borderRadius: 6, fontSize: 12.5, color: "var(--text-2)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <I.Plus size={13} /> Create new workspace
          </button>
        </div>
      )}
    </div>
  );
}

function OrgRow({ name, sub, active }) {
  return (
    <button style={{
      display: "flex", alignItems: "center", gap: 9, width: "100%",
      padding: "7px 8px", borderRadius: 6, fontSize: 12.5,
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <div style={{
        width: 22, height: 22, borderRadius: 5,
        background: active ? "var(--text)" : "var(--surface-hi)",
        color: active ? "var(--bg)" : "var(--text-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600,
      }}>{name[0]}</div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontWeight: 500 }}>{name}</div>
        <div className="dim" style={{ fontSize: 10.5 }}>{sub}</div>
      </div>
      {active && <I.Check size={13} style={{ color: "var(--accent)" }} />}
    </button>
  );
}

function UserChip() {
  const { state } = useStore();
  const [open, setOpen] = useStateN(false);
  const [orgsOpen, setOrgsOpen] = useStateN(false);
  const ref = useRefN(null);
  useEffectN(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setOrgsOpen(false); } };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", margin: "0 4px" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 9,
        padding: "7px 8px", borderRadius: 8,
        background: open ? "var(--hover)" : "transparent",
      }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "color-mix(in oklab, var(--hover) 50%, transparent)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <Avatar name={state.user.name} size={22} />
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.user.name}</div>
          <div className="dim" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.org.name}</div>
        </div>
        <I.More size={14} style={{ color: "var(--dim)" }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--panel)", border: "0.5px solid var(--border-hi)",
          borderRadius: 9, padding: 5, boxShadow: "var(--shadow-pop)", zIndex: 50,
        }}>
          {/* Account info */}
          <div style={{ padding: "8px 9px 6px", display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar name={state.user.name} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.user.name}</div>
              <div className="dim" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.user.email}</div>
            </div>
          </div>

          <div className="hr" style={{ margin: "3px 0" }} />

          {/* Workspace */}
          <div style={{ padding: "4px 9px 2px", fontSize: 10, fontWeight: 500, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Workspace
          </div>
          <button onClick={() => setOrgsOpen(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 8px", borderRadius: 6, fontSize: 12.5 }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div style={{
              width: 22, height: 22, borderRadius: 5,
              background: "var(--text)", color: "var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, letterSpacing: "-0.02em",
            }}>{state.org.name[0]}</div>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.org.name}</div>
              <div className="dim" style={{ fontSize: 10.5 }}>{state.org.plan} · {state.org.seatsUsed}/{state.org.seats}</div>
            </div>
            <I.ChevronDown size={12} style={{ color: "var(--dim)", transform: orgsOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>

          {orgsOpen && (
            <div style={{ padding: "2px 0 4px", borderTop: "0.5px solid var(--divider)", marginTop: 3 }}>
              <OrgRow name={state.org.name} sub={`${state.org.seatsUsed} members`} active />
              <OrgRow name="Side Hustle Co." sub="Pro · 1 member" />
              <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", width: "100%", borderRadius: 6, fontSize: 12.5, color: "var(--text-2)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <I.Plus size={13} /> Create new workspace
              </button>
            </div>
          )}

          <div className="hr" style={{ margin: "4px 0" }} />
          {["Account", "Notifications", "Keyboard shortcuts", "What's new"].map(l =>
            <MenuItem key={l} label={l} />
          )}
          <div className="hr" style={{ margin: "4px 0" }} />
          <MenuItem label="Sign out" danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, icon, danger, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, width: "100%",
      padding: "7px 9px", borderRadius: 5, fontSize: 12.5,
      color: danger ? "var(--danger)" : "var(--text-2)",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      {icon}{label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Top bar (per-screen search + global help)
// ─────────────────────────────────────────────────────────────────
function Topbar({ left, right }) {
  return (
    <div style={{
      height: 32, padding: "0 16px",
      borderBottom: "0.5px solid var(--divider)",
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--bg)",
    }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>{left}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {right}
        <button className="iconbtn sm" data-tip="Search (⌘K)"><I.Search size={13} /></button>
        <button className="iconbtn sm" data-tip="Notifications"><I.Bell size={13} /></button>
        <div style={{ width: 1, height: 14, background: "var(--divider)", margin: "0 4px" }} />
        <button className="btn ghost sm" style={{ gap: 5, height: 22, padding: "0 8px", fontSize: 11 }}>
          <I.Sparkles size={11} /> What's new
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, MenuItem });
