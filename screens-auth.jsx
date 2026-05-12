// screens-auth.jsx — Auth flow: signin → org create → invite → role pick

const { useState: useStateA, useEffect: useEffectA } = React;

function AuthShell({ children, side }) {
  return (
    <div className="mesh" style={{
      width: "100vw", height: "100vh",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      overflow: "hidden",
    }}>
      {/* Left — content */}
      <div style={{
        display: "flex", flexDirection: "column",
        padding: "32px 56px",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(0)",
        position: "relative",
        overflow: "auto",
      }}>
        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <I.Logo size={22} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>EinKal</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 380, width: "100%", margin: "0 auto" }}>
          {children}
        </div>

        <div className="dim" style={{ fontSize: 11.5, display: "flex", justifyContent: "space-between" }}>
          <span>© 2026 EinKal</span>
          <span style={{ display: "flex", gap: 14 }}>
            <a>Privacy</a><a>Terms</a><a>Status</a>
          </span>
        </div>
      </div>

      {/* Right — illustration */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderLeft: "0.5px solid var(--divider)",
      }}>
        {side || <AuthHero />}
      </div>
    </div>
  );
}

function AuthHero() {
  // floating cards illustration
  return (
    <div style={{ position: "absolute", inset: 0, padding: 60 }}>
      <div style={{
        position: "absolute", top: "8%", right: "8%",
        fontSize: 54, fontWeight: 700,
        color: "var(--text)", letterSpacing: "-0.035em", lineHeight: 1.02,
        maxWidth: 420,
      }}>
        No more <br />
        <span style={{ color: "var(--accent)" }}>double-bookings,</span> <br />
        ever.
      </div>
      <div style={{
        position: "absolute", top: "30%", right: "8%", maxWidth: 360,
        color: "var(--text-2)", fontSize: 15, lineHeight: 1.55,
      }}>
        One calendar to plan from. The others stay quietly in sync — without leaking who you're actually meeting.
      </div>

      {/* fake calendar cards */}
      <FloatingCal x="42%" y="48%" w={260} title="Work" color="#4f78e8" events={[
        { t: "9:00", l: "Standup" },
        { t: "11:30", l: "Customer — Northwind" },
        { t: "2:00", l: "Design review" },
      ]} />
      <FloatingCal x="55%" y="62%" w={260} title="Personal" color="#a45fc6" events={[
        { t: "9:00", l: "Busy" },
        { t: "11:30", l: "Busy" },
        { t: "2:00", l: "Busy" },
      ]} stamp="hidden" />
      <FloatingCal x="68%" y="76%" w={260} title="Consulting" color="#e25c5c" events={[
        { t: "9:00", l: "Standup" },
        { t: "11:30", l: "Busy — Work" },
        { t: "2:00", l: "Design review" },
      ]} stamp="mirrored" />

      {/* connector arrows */}
      <svg style={{ position: "absolute", left: "47%", top: "55%", pointerEvents: "none" }} width="160" height="120">
        <defs>
          <linearGradient id="line-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2ECC71" stopOpacity="0.0" />
            <stop offset="1" stopColor="#2ECC71" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d="M5,5 C30,40 60,60 110,90" stroke="url(#line-g)" strokeWidth="1.4" fill="none" strokeDasharray="3 3" />
      </svg>
    </div>
  );
}

function FloatingCal({ x, y, w, title, color, events, stamp }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w,
      background: "var(--panel)", border: "0.5px solid var(--border-hi)",
      borderRadius: 12, padding: 14, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <div style={{ fontSize: 12, fontWeight: 500 }}>{title}</div>
        {stamp && (
          <div style={{
            marginLeft: "auto", fontSize: 9.5, padding: "2px 6px",
            color: "var(--accent)", background: "var(--accent-bg)",
            borderRadius: 999, fontWeight: 500, letterSpacing: "0.03em", textTransform: "uppercase",
          }}>{stamp}</div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {events.map((e, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 8px", borderRadius: 5,
            background: "color-mix(in oklab, " + color + " 12%, transparent)",
            borderLeft: `2px solid ${color}`,
            fontSize: 11,
          }}>
            <span className="mono dim" style={{ fontSize: 10 }}>{e.t}</span>
            <span style={{ color: e.l === "Busy" || e.l.startsWith("Busy") ? "var(--dim)" : "var(--text)" }}>{e.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sign-in screen
// ─────────────────────────────────────────────────────────────────
function SignIn({ onContinue, onSkip }) {
  const [email, setEmail] = useStateA("");
  const [loading, setLoading] = useStateA(null);

  const provider = (kind) => {
    setLoading(kind);
    setTimeout(() => { setLoading(null); onContinue({ provider: kind, email: "alex@levitatedata.com" }); }, 900);
  };

  return (
    <AuthShell>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 14 }}>
        Sign in
      </div>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.15 }}>
        Welcome back.
      </h1>
      <div style={{ marginTop: 8, color: "var(--text-2)", fontSize: 14.5, lineHeight: 1.5 }}>
        Pick the calendar you live in. The rest will catch up.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 28 }}>
        <ProviderBtn onClick={() => provider("google")} loading={loading === "google"}
          icon={<Provider.Google size={17} />} label="Continue with Google" />
        <ProviderBtn onClick={() => provider("microsoft")} loading={loading === "microsoft"}
          icon={<Provider.Microsoft size={17} />} label="Continue with Microsoft" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
        <div className="hr" style={{ flex: 1 }} />
        <span className="dim" style={{ fontSize: 11 }}>OR</span>
        <div className="hr" style={{ flex: 1 }} />
      </div>

      <div>
        <label className="label">Work email</label>
        <input className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn primary" style={{ width: "100%", marginTop: 10 }}
          onClick={() => onContinue({ provider: "email", email })} disabled={!email}>
          Send magic link <I.ArrowRight size={14} />
        </button>
      </div>

      <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--dim)", textAlign: "center" }}>
        New to EinKal? <a style={{ color: "var(--accent)", cursor: "default" }} onClick={() => onContinue({ provider: "google", email: "alex@levitatedata.com", isNew: true })}>Start a workspace</a>
      </div>

      <button onClick={onSkip} className="btn ghost sm" style={{ marginTop: 18, alignSelf: "center" }}>
        Skip to demo <I.ArrowRight size={12} />
      </button>
    </AuthShell>
  );
}

function ProviderBtn({ icon, label, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", height: 32, padding: "0 12px",
      display: "flex", alignItems: "center", gap: 10,
      background: "var(--panel)", border: "0.5px solid var(--border-hi)",
      borderRadius: 9, fontSize: 13.5, fontWeight: 500,
      transition: "background 0.12s, border-color 0.12s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hi)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "var(--panel)"}>
      {loading ? <Spinner /> : icon}
      <span>{label}</span>
      <span style={{ flex: 1 }} />
      {!loading && <I.ArrowRight size={13} style={{ color: "var(--dim)" }} />}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: "50%",
      border: "1.5px solid var(--border)",
      borderTopColor: "var(--accent)",
      animation: "spin 0.7s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Onboarding (org create + invite + role pick)
// ─────────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useStateA(0);
  const [org, setOrg] = useStateA({ name: "", slug: "", role: "lead", size: "5-25" });
  const [invites, setInvites] = useStateA([
    { email: "priya@levitatedata.com", role: "admin" },
    { email: "marco@levitatedata.com", role: "member" },
    { email: "", role: "member" },
  ]);

  const steps = ["Workspace", "Your role", "Invite team", "Ready"];

  return (
    <AuthShell side={<OnboardingHero step={step} steps={steps} />}>
      <Stepper count={4} current={step} />

      {step === 0 && (
        <div className="fade-in">
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em" }}>What should we call your workspace?</h2>
          <div className="dim" style={{ marginTop: 6, fontSize: 13.5 }}>You can change this later. Your team will see it in the sidebar.</div>

          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">Workspace name</label>
              <input className="input" placeholder="Acme, Inc." value={org.name}
                onChange={(e) => setOrg(o => ({ ...o, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }))} />
            </div>
            <div>
              <label className="label">URL slug</label>
              <div style={{ position: "relative" }}>
                <input className="input" placeholder="acme" value={org.slug} onChange={(e) => setOrg(o => ({ ...o, slug: e.target.value }))} style={{ paddingLeft: 84 }} />
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--dim)", fontSize: 13, fontFamily: "var(--font-mono)", pointerEvents: "none" }}>einkal.com/</span>
              </div>
            </div>
            <div>
              <label className="label">How big is your team?</label>
              <Segmented value={org.size} onChange={(v) => setOrg(o => ({ ...o, size: v }))}
                options={["Just me", "2-4", "5-25", "26+"]} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
            <button className="btn primary lg" style={{ flex: 1 }} onClick={() => setStep(1)} disabled={!org.name}>
              Continue <I.ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="fade-in">
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em" }}>What's your role?</h2>
          <div className="dim" style={{ marginTop: 6, fontSize: 13.5 }}>This helps us tune defaults. You'll be the workspace owner.</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 22 }}>
            {[
              { id: "founder", icon: <I.Sparkles size={15} />, l: "Founder", b: "Solo or co-founder" },
              { id: "lead", icon: <I.Team size={15} />, l: "Team lead", b: "Manage 2+ people" },
              { id: "ic", icon: <I.User size={15} />, l: "Individual", b: "Heads-down maker" },
              { id: "ea", icon: <I.Calendar size={15} />, l: "Executive assistant", b: "Manage others' time" },
            ].map(r => (
              <button key={r.id} onClick={() => setOrg(o => ({ ...o, role: r.id }))}
                style={{
                  padding: "14px 14px",
                  background: org.role === r.id ? "var(--accent-bg)" : "var(--surface)",
                  border: org.role === r.id ? "1px solid var(--accent)" : "0.5px solid var(--border)",
                  borderRadius: 10, textAlign: "left",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                <div style={{ color: org.role === r.id ? "var(--accent)" : "var(--dim)" }}>{r.icon}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.l}</div>
                <div className="dim" style={{ fontSize: 11.5 }}>{r.b}</div>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
            <button className="btn lg" onClick={() => setStep(0)}><I.ArrowLeft size={13} /> Back</button>
            <button className="btn primary lg" style={{ flex: 1 }} onClick={() => setStep(2)}>Continue <I.ArrowRight size={14} /></button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="fade-in">
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em" }}>Invite your team.</h2>
          <div className="dim" style={{ marginTop: 6, fontSize: 13.5 }}>Calendar sync is a team sport. Add the people who'll connect their own calendars.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 22 }}>
            {invites.map((inv, i) => (
              <div key={i} style={{ display: "flex", gap: 6 }}>
                <input className="input" placeholder="teammate@company.com" style={{ flex: 1 }}
                  value={inv.email}
                  onChange={(e) => setInvites(invs => invs.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
                <select className="input select" style={{ width: 110 }} value={inv.role}
                  onChange={(e) => setInvites(invs => invs.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="billing">Billing</option>
                </select>
                <button className="iconbtn" onClick={() => setInvites(invs => invs.filter((_, j) => j !== i))} style={{ width: 32, height: 32 }}>
                  <I.X size={13} />
                </button>
              </div>
            ))}
            <button className="btn ghost sm" style={{ alignSelf: "flex-start", marginTop: 4 }}
              onClick={() => setInvites(invs => [...invs, { email: "", role: "member" }])}>
              <I.Plus size={12} /> Add another
            </button>
          </div>

          <div style={{ marginTop: 18, padding: "10px 12px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 8, display: "flex", gap: 9, alignItems: "flex-start" }}>
            <I.Info size={13} style={{ color: "var(--dim)", marginTop: 1 }} />
            <div className="dim" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Each teammate connects their <strong style={{ color: "var(--text-2)" }}>own</strong> calendars. EinKal never reads events you don't explicitly sync.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
            <button className="btn lg" onClick={() => setStep(1)}><I.ArrowLeft size={13} /> Back</button>
            <button className="btn lg" onClick={() => setStep(3)}>Skip for now</button>
            <button className="btn primary lg" style={{ flex: 1 }} onClick={() => setStep(3)}>Send invites <I.ArrowRight size={14} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="fade-in" style={{ textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 20px",
            borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--accent-bg)", color: "var(--accent)",
          }}>
            <I.Check size={28} />
          </div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 500, letterSpacing: "-0.015em" }}>You're in.</h2>
          <div className="dim" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.55 }}>
            Workspace <strong style={{ color: "var(--text)" }}>{org.name || "Levitate Data"}</strong> is ready. Next stop: connect your first calendar.
          </div>
          <button className="btn primary lg" style={{ marginTop: 28, minWidth: 200 }} onClick={onDone}>
            Open EinKal <I.ArrowRight size={14} />
          </button>
        </div>
      )}
    </AuthShell>
  );
}

function Stepper({ count, current }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 22 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          height: 3, flex: 1, borderRadius: 2,
          background: i <= current ? "var(--accent)" : "var(--border)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

function OnboardingHero({ step, steps }) {
  return (
    <div style={{ position: "absolute", inset: 0, padding: "56px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 18 }}>
        Setup · step {step + 1} of {steps.length}
      </div>
      <h2 style={{ fontWeight: 700, fontSize: 46, lineHeight: 1.04, margin: 0, letterSpacing: "-0.035em" }}>
        {step === 0 && <>A home base <br />for your <span style={{ color: "var(--accent)" }}>calendars.</span></>}
        {step === 1 && <>Tell us how you <br />actually <span style={{ color: "var(--accent)" }}>work.</span></>}
        {step === 2 && <>Better <span style={{ color: "var(--accent)" }}>together.</span></>}
        {step === 3 && <>Welcome to <br />the <span style={{ color: "var(--accent)" }}>quiet life.</span></>}
      </h2>
      <div style={{ marginTop: 18, fontSize: 15, lineHeight: 1.6, color: "var(--text-2)", maxWidth: 420 }}>
        {step === 0 && "One workspace, every calendar, every account. Your team plans on their own — EinKal keeps the lights on."}
        {step === 1 && "We'll preset sync flows for your role. Tighter privacy if you manage people. Working-hours-only if you're a maker."}
        {step === 2 && "Each teammate keeps full control. They wire up their own accounts. You manage seats and billing."}
        {step === 3 && "Two more minutes to your first sync. Let's go."}
      </div>

      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: i <= step ? 1 : 0.4, transition: "opacity 0.3s" }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i < step ? "var(--accent)" : i === step ? "var(--accent-bg)" : "var(--surface)",
              border: i === step ? "1px solid var(--accent)" : "0.5px solid var(--border)",
              color: i < step ? "var(--ink-on-accent)" : "var(--text-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 600,
            }}>
              {i < step ? <I.Check size={11} /> : i + 1}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: i === step ? 500 : 400 }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SignIn, Onboarding, AuthShell });
