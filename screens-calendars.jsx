// screens-calendars.jsx — Calendars screen + Connect modal

const { useState: useStateC, useEffect: useEffectC } = React;

function CalendarsScreen() {
  const { state, updateCalendar, removeAccount, addAccount, pushActivity } = useStore();
  const toast = useToast();
  const [connectOpen, setConnectOpen] = useStateC(false);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Calendars"
        subtitle="Connect Google and Microsoft accounts. Pick a color and decide what's visible by default."
        actions={
          <button className="btn primary" onClick={() => setConnectOpen(true)}>
            <I.Plus size={13} /> Connect calendar
          </button>
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {state.accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc}
              onUpdate={(calId, patch) => updateCalendar(calId, patch)}
              onRemove={() => {
                if (confirm(`Disconnect ${acc.email}? This won't delete events, but syncs using these calendars will pause.`)) {
                  removeAccount(acc.id);
                  pushActivity(`Disconnected ${acc.email}`, "connect");
                  toast(`${acc.email} disconnected`, "info");
                }
              }} />
          ))}

          {/* connect cta */}
          <button onClick={() => setConnectOpen(true)} style={{
            padding: "24px", borderRadius: 12,
            border: "1px dashed var(--border-hi)",
            background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            color: "var(--dim)", fontSize: 13.5,
            transition: "background 0.12s, color 0.12s, border-color 0.12s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--dim)"; e.currentTarget.style.borderColor = "var(--border-hi)"; }}>
            <I.Plus size={14} /> Connect another account
          </button>
        </div>
      </div>

      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={(acc) => {
        addAccount(acc);
        pushActivity(`Connected ${acc.email}`, "connect");
        toast(`Connected ${acc.email}`, "ok");
        setConnectOpen(false);
      }} />
    </div>
  );
}

function AccountCard({ account, onUpdate, onRemove }) {
  const [open, setOpen] = useStateC(false);
  const Mark = account.provider === "google" ? Provider.Google : Provider.Microsoft;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setOpen(o => !o)} className="iconbtn" style={{ marginLeft: -6 }}>
          <I.Chevron size={13} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: "var(--surface-hi)", border: "0.5px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Mark size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{account.email}</span>
            <span className="chip">{account.label}</span>
            {account.status === "active" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ok)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok)" }} />
                Active
              </span>
            )}
          </div>
          <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>
            {account.provider === "google" ? "Google Calendar" : "Microsoft Outlook"} · {account.calendars.length} calendar{account.calendars.length === 1 ? "" : "s"} · connected {account.connectedAt}
          </div>
        </div>
        <button className="btn sm"><I.Refresh size={12} /> Sync now</button>
        <button className="btn sm danger" onClick={onRemove}><I.Unlink size={12} /> Disconnect</button>
      </div>

      {open && (
        <>
          <div className="hr" />
          <div style={{ padding: "4px 0" }}>
            <CalendarTableHeader />
            {account.calendars.map((cal) => (
              <CalendarRow key={cal.id} cal={cal} onUpdate={(patch) => onUpdate(cal.id, patch)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CalendarTableHeader() {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 1fr 110px 100px 80px 50px",
      gap: 14, padding: "6px 18px 6px 22px",
      fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
      color: "var(--muted)",
    }}>
      <span></span>
      <span>Calendar</span>
      <span>Role</span>
      <span>In syncs</span>
      <span>Visible</span>
      <span></span>
    </div>
  );
}

function CalendarRow({ cal, onUpdate }) {
  const { state } = useStore();
  const inSyncs = state.flows.filter(f => f.sources.includes(cal.id) || f.destinations.includes(cal.id)).length;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 1fr 110px 100px 80px 50px",
      gap: 14, padding: "10px 18px 10px 22px",
      alignItems: "center",
      borderTop: "0.5px solid var(--divider)",
    }}>
      <ColorSwatch value={cal.color} onChange={(v) => onUpdate({ color: v })} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 450, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cal.name}</span>
          {cal.primary && <span className="chip" style={{ height: 18, fontSize: 10, padding: "0 6px" }}>Primary</span>}
        </div>
      </div>
      <div className="dim" style={{ fontSize: 12, textTransform: "capitalize" }}>{cal.role}</div>
      <div>
        {inSyncs > 0 ? (
          <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>{inSyncs} flow{inSyncs === 1 ? "" : "s"}</span>
        ) : (
          <span className="dim" style={{ fontSize: 12 }}>—</span>
        )}
      </div>
      <button className={"toggle " + (cal.visible ? "on" : "")} onClick={() => onUpdate({ visible: !cal.visible })} />
      <button className="iconbtn"><I.More size={14} /></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Connect modal — provider chooser + fake OAuth
// ─────────────────────────────────────────────────────────────────
function ConnectModal({ open, onClose, onConnect }) {
  const [step, setStep] = useStateC(0);
  const [provider, setProvider] = useStateC(null);
  const [authing, setAuthing] = useStateC(false);

  useEffectC(() => { if (open) { setStep(0); setProvider(null); setAuthing(false); } }, [open]);

  const handlePick = (p) => {
    setProvider(p);
    setStep(1);
    setAuthing(true);
    setTimeout(() => { setAuthing(false); setStep(2); }, 1100);
  };

  const handleFinish = (label) => {
    const isGoogle = provider === "google";
    const id = "acc-" + Math.random().toString(36).slice(2, 6);
    const calBase = id + "-c";
    onConnect({
      id, provider, email: isGoogle ? "new.account@gmail.com" : "new.account@outlook.com",
      label, connectedAt: "today", status: "active",
      calendars: [
        { id: calBase + "1", name: isGoogle ? "new.account@gmail.com" : "new.account@outlook.com", color: "#5ba6f0", primary: true, visible: true, role: "owner" },
        { id: calBase + "2", name: "Birthdays", color: "#dc6c9b", primary: false, visible: false, role: "reader" },
      ],
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Connect a calendar" width={520}>
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="dim" style={{ fontSize: 13, marginBottom: 4 }}>
            Choose a provider. We'll redirect you to authorize EinKal — read-only by default. You'll pick which calendars to actually use on the next screen.
          </div>
          <ProviderRow icon={<Provider.Google size={20} />} name="Google Calendar" sub="Personal, Workspace, or School accounts" onClick={() => handlePick("google")} />
          <ProviderRow icon={<Provider.Microsoft size={20} />} name="Microsoft Outlook" sub="Personal, Office 365, Exchange" onClick={() => handlePick("microsoft")} />
          <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 8, display: "flex", gap: 9 }}>
            <I.Shield size={14} style={{ color: "var(--ok)", marginTop: 1 }} />
            <div style={{ fontSize: 12, lineHeight: 1.5 }} className="t2">
              EinKal reads event metadata to mirror it. We never read attendee email content. <a style={{ color: "var(--accent)", cursor: "default" }}>Privacy details</a>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--surface-hi)", border: "0.5px solid var(--border)",
          }}>
            {provider === "google" ? <Provider.Google size={28} /> : <Provider.Microsoft size={28} />}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Authorizing with {provider === "google" ? "Google" : "Microsoft"}…</div>
          <Spinner />
          <div className="dim" style={{ fontSize: 12, textAlign: "center", maxWidth: 320 }}>
            You'd normally see a provider consent screen here. We're skipping it for the demo.
          </div>
        </div>
      )}

      {step === 2 && (
        <ConnectFinish provider={provider} onCancel={onClose} onFinish={handleFinish} />
      )}
    </Modal>
  );
}

function ProviderRow({ icon, name, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      background: "var(--surface)", border: "0.5px solid var(--border)",
      borderRadius: 9, textAlign: "left",
      transition: "background 0.12s, border-color 0.12s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hi)"; e.currentTarget.style.borderColor = "var(--border-hi)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
      {icon}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{name}</div>
        <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{sub}</div>
      </div>
      <I.ArrowRight size={14} style={{ color: "var(--dim)" }} />
    </button>
  );
}

function ConnectFinish({ provider, onFinish, onCancel }) {
  const [label, setLabel] = useStateC("Work");
  const [picked, setPicked] = useStateC({});
  // mock list of calendars discovered from the provider
  const discovered = provider === "google"
    ? [
      { id: "d1", name: "new.account@gmail.com", primary: true },
      { id: "d2", name: "Birthdays" },
      { id: "d3", name: "Holidays in US" },
      { id: "d4", name: "Side project" },
    ]
    : [
      { id: "d1", name: "new.account@outlook.com", primary: true },
      { id: "d2", name: "Birthdays" },
      { id: "d3", name: "Team — Marketing" },
    ];

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label className="label">Label</label>
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Work, Personal, Consulting" />
        <div className="help">Helps you tell accounts apart. Shows up in the sidebar.</div>
      </div>
      <label className="label">Which calendars should EinKal see?</label>
      <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {discovered.map((c, i) => {
          const on = picked[c.id] !== false; // default on
          return (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              borderTop: i === 0 ? "none" : "0.5px solid var(--divider)",
            }}>
              <button className={"toggle " + (on ? "on" : "")} onClick={() => setPicked(p => ({ ...p, [c.id]: !on }))} />
              <span style={{ fontSize: 13, fontWeight: 450 }}>{c.name}</span>
              {c.primary && <span className="chip" style={{ height: 18, fontSize: 10 }}>Primary</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={() => onFinish(label)}>
          <I.Check size={13} /> Add account
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarsScreen });
