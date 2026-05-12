// nav.jsx — Sidebar, Topbar, OrgSwitcher

const { useState: useStateN, useEffect: useEffectN, useRef: useRefN } = React;

function Sidebar({ route, onNav, collapsed, onToggle }) {
  const { state } = useStore();
  const [tooltip, setTooltip] = useStateN(null); // { id, y }

  const items = [
    { id: "dashboard", label: "Dashboard",    icon: <I.Dashboard size={16} /> },
    { id: "calendars", label: "Calendars",    icon: <I.Calendar size={16} /> },
    { id: "sync",      label: "Sync flows",   icon: <I.Sync size={16} />, badge: state.flows.filter(f => !f.paused).length },
    { id: "booking",   label: "Booking",      icon: <I.Link size={16} /> },
    { id: "team",      label: "Team",         icon: <I.Team size={16} /> },
    { id: "settings",  label: "Settings",     icon: <I.Settings size={16} /> },
    { id: "billing",   label: "Billing",      icon: <I.Billing size={16} /> },
  ];

  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      background: "var(--bg-1)",
      borderRight: "0.5px solid var(--divider)",
      padding: collapsed ? "12px 6px" : "12px 10px",
      gap: 4,
      height: "100%",
      overflow: "hidden",
      transition: "padding 0.2s",
    }}>
      {/* Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: collapsed ? 0 : 8,
        padding: collapsed ? "10px 4px 20px" : "10px 8px 20px",
        overflow: "hidden",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: "var(--text)", color: "var(--bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11.5, fontWeight: 700, letterSpacing: "-0.03em",
        }}>K</div>
        {!collapsed && <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>EinKal</div>}
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => onNav(it.id)}
            onMouseEnter={(e) => {
              if (route !== it.id) e.currentTarget.style.background = "color-mix(in oklab, var(--hover) 50%, transparent)";
              if (collapsed) {
                const r = e.currentTarget.getBoundingClientRect();
                setTooltip({ id: it.id, y: r.top + r.height / 2 });
              }
            }}
            onMouseLeave={(e) => {
              if (route !== it.id) e.currentTarget.style.background = "transparent";
              setTooltip(null);
            }}
            style={{
              display: "flex", alignItems: "center",
              gap: collapsed ? 0 : 10,
              padding: collapsed ? "7px 0" : "7px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 7, fontSize: 13, fontWeight: 450,
              color: route === it.id ? "var(--text)" : "var(--text-2)",
              background: route === it.id ? "var(--hover)" : "transparent",
              transition: "background 0.1s, color 0.1s",
              overflow: "hidden",
              position: "relative",
            }}>
            <span style={{ color: route === it.id ? "var(--accent)" : "var(--dim)", flexShrink: 0 }}>{it.icon}</span>
            {!collapsed && <span style={{ flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>{it.label}</span>}
            {!collapsed && it.badge != null && (
              <span style={{ fontSize: 10.5, fontWeight: 500, fontFamily: "var(--font-mono)", background: "var(--surface-hi)", color: "var(--text-2)", padding: "1px 6px", borderRadius: 999 }}>{it.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Status card (hidden when collapsed) */}
      {!collapsed && (
        <div style={{ margin: "0 4px 4px", padding: "10px 12px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span className="pulse" />
            <span style={{ fontSize: 11.5, fontWeight: 500 }}>All syncs running</span>
          </div>
          <div className="dim" style={{ fontSize: 11, lineHeight: 1.45 }}>
            {state.flows.filter(f => !f.paused).length} active flows · last check 12s ago
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button onClick={onToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, padding: collapsed ? "7px 0" : "7px 10px", borderRadius: 7, color: "var(--muted)", transition: "background 0.1s" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <I.Chevron size={14} style={{ transform: collapsed ? "none" : "rotate(180deg)", transition: "transform 0.2s", color: "var(--dim)" }} />
        {!collapsed && <span style={{ fontSize: 12, color: "var(--muted)" }}>Collapse</span>}
      </button>

      <UserChip collapsed={collapsed} />

      {/* Hover tooltip when collapsed */}
      {collapsed && tooltip && (
        <div style={{
          position: "fixed", left: 56, top: tooltip.y - 14,
          background: "var(--panel)", border: "0.5px solid var(--border-hi)",
          borderRadius: 6, padding: "5px 10px", fontSize: 12.5, fontWeight: 500,
          color: "var(--text)", boxShadow: "var(--shadow-pop)", zIndex: 200,
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {items.find(i => i.id === tooltip.id)?.label}
          {items.find(i => i.id === tooltip.id)?.badge != null && (
            <span style={{ marginLeft: 6, fontSize: 10, background: "var(--surface-hi)", padding: "1px 5px", borderRadius: 999 }}>
              {items.find(i => i.id === tooltip.id).badge}
            </span>
          )}
        </div>
      )}
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
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 8, background: open ? "var(--hover)" : "transparent", transition: "background 0.12s" }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "color-mix(in oklab, var(--hover) 50%, transparent)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--accent)", color: "var(--ink-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em" }}>{state.org.name[0]}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.2 }}>{state.org.name}</div>
          <div className="dim" style={{ fontSize: 10.5, lineHeight: 1.2 }}>{state.org.plan} · {state.org.seatsUsed}/{state.org.seats}</div>
        </div>
        <I.ChevronDown size={13} style={{ color: "var(--dim)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--panel)", border: "0.5px solid var(--border-hi)", borderRadius: 9, boxShadow: "var(--shadow-pop)", padding: 5, zIndex: 50 }}>
          <OrgRow name={state.org.name} sub={`${state.org.seatsUsed} members`} active />
          <OrgRow name="Side Hustle Co." sub="Pro · 1 member" />
          <div className="hr" style={{ margin: "5px 0" }} />
          <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", width: "100%", borderRadius: 6, fontSize: 12.5, color: "var(--text-2)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <I.Plus size={13} /> Create new workspace
          </button>
        </div>
      )}
    </div>
  );
}

function OrgRow({ name, sub, active }) {
  return (
    <button style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "7px 8px", borderRadius: 6, fontSize: 12.5 }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div style={{ width: 22, height: 22, borderRadius: 5, background: active ? "var(--text)" : "var(--surface-hi)", color: active ? "var(--bg)" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>{name[0]}</div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontWeight: 500 }}>{name}</div>
        <div className="dim" style={{ fontSize: 10.5 }}>{sub}</div>
      </div>
      {active && <I.Check size={13} style={{ color: "var(--accent)" }} />}
    </button>
  );
}

function UserChip({ collapsed }) {
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
        width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
        gap: collapsed ? 0 : 9, padding: collapsed ? "7px 0" : "7px 8px", borderRadius: 8,
        background: open ? "var(--hover)" : "transparent",
      }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "color-mix(in oklab, var(--hover) 50%, transparent)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <Avatar name={state.user.name} size={22} />
        {!collapsed && (
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.user.name}</div>
            <div className="dim" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.org.name}</div>
          </div>
        )}
        {!collapsed && <I.More size={14} style={{ color: "var(--dim)" }} />}
      </button>
      {open && (
        <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: collapsed ? 0 : 0, right: collapsed ? "auto" : 0, width: collapsed ? 200 : "auto", transform: collapsed ? "translateX(48px)" : "none", background: "var(--panel)", border: "0.5px solid var(--border-hi)", borderRadius: 9, padding: 5, boxShadow: "var(--shadow-pop)", zIndex: 50 }}>
          <div style={{ padding: "8px 9px 6px", display: "flex", alignItems: "center", gap: 9 }}>
            <Avatar name={state.user.name} size={26} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.user.name}</div>
              <div className="dim" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{state.user.email}</div>
            </div>
          </div>
          <div className="hr" style={{ margin: "3px 0" }} />
          {["Account", "Notifications", "Keyboard shortcuts", "What's new"].map(l => <MenuItem key={l} label={l} />)}
          <div className="hr" style={{ margin: "4px 0" }} />
          <MenuItem label="Sign out" danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, icon, danger, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 9px", borderRadius: 5, fontSize: 12.5, color: danger ? "var(--danger)" : "var(--text-2)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {icon}{label}
    </button>
  );
}

function Topbar({ left, right }) {
  return (
    <div style={{ height: 32, padding: "0 16px", borderBottom: "0.5px solid var(--divider)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg)" }}>
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
