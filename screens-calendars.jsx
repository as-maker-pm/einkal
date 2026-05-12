// screens-calendars.jsx — Notion-style calendar + Connect modal

const { useState: useStateC, useEffect: useEffectC, useMemo: useMemoC } = React;

const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function seedRand(n) {
  let s = (n | 0) || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 15;
    return (s >>> 0) / 4294967296;
  };
}

function genCalEvents(cal, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seed = cal.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + year * 13 + month * 31;
  const rng = seedRand(seed);
  const titles = ["Standup","1:1","Review","Client call","Planning","Sprint sync","Interview","Demo","Workshop","Lunch","Check-in","Kickoff","Retrospective","Deep work","Brainstorm","Strategy"];
  const count = 4 + Math.floor(rng() * 6);
  const used = new Set();
  const events = [];
  for (let i = 0; i < count; i++) {
    let day, tries = 0;
    do { day = 1 + Math.floor(rng() * daysInMonth); tries++; } while (used.has(day) && tries < 20);
    used.add(day);
    events.push({ id: `${cal.id}-e${i}`, day, title: titles[Math.floor(rng() * titles.length)], color: cal.color, calName: cal.name });
  }
  return events;
}

// ─────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────
function CalendarsScreen() {
  const { state, updateCalendar, addAccount, pushActivity } = useStore();
  const toast = useToast();
  const [connectOpen, setConnectOpen] = useStateC(false);
  const todayDate = new Date(2026, 4, 12);
  const [curYear, setCurYear] = useStateC(2026);
  const [curMonth, setCurMonth] = useStateC(4);
  const [selectedDay, setSelectedDay] = useStateC(12);

  const allCals = useMemoC(() =>
    state.accounts.flatMap(a => a.calendars.map(c => ({ ...c, account: a }))),
    [state.accounts]
  );
  const visibleCals = allCals.filter(c => c.visible);
  const events = useMemoC(() =>
    visibleCals.flatMap(c => genCalEvents(c, curYear, curMonth)),
    [visibleCals, curYear, curMonth]
  );

  const goMonth = (d) => {
    const nm = curMonth + d;
    if (nm < 0) { setCurYear(y => y - 1); setCurMonth(11); }
    else if (nm > 11) { setCurYear(y => y + 1); setCurMonth(0); }
    else setCurMonth(nm);
  };

  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>

      {/* ── Left sidebar ── */}
      <div style={{ width: 210, flexShrink: 0, borderRight: "0.5px solid var(--divider)", display: "flex", flexDirection: "column", background: "var(--bg-1)" }}>

        {/* Mini month navigator */}
        <div style={{ padding: "16px 14px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button className="iconbtn" onClick={() => goMonth(-1)} style={{ width: 22, height: 22 }}>
              <I.Chevron size={12} style={{ transform: "rotate(180deg)" }} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{CAL_MONTHS[curMonth].slice(0, 3)} {curYear}</span>
            <button className="iconbtn" onClick={() => goMonth(1)} style={{ width: 22, height: 22 }}>
              <I.Chevron size={12} />
            </button>
          </div>
          <MiniMonthGrid year={curYear} month={curMonth} todayDate={todayDate} selectedDay={selectedDay} onSelect={setSelectedDay} />
        </div>

        <div style={{ height: "0.5px", background: "var(--divider)" }} />

        {/* Calendar list grouped by account */}
        <div style={{ flex: 1, overflow: "auto", padding: "10px 0" }}>
          {state.accounts.map(acc => {
            const Mark = acc.provider === "google" ? Provider.Google : Provider.Microsoft;
            return (
              <div key={acc.id} style={{ marginBottom: 12 }}>
                <div style={{ padding: "4px 14px 5px", display: "flex", alignItems: "center", gap: 6 }}>
                  <Mark size={10} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acc.label}</span>
                </div>
                {acc.calendars.map(c => (
                  <button key={c.id} onClick={() => updateCalendar(c.id, { visible: !c.visible })}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "4px 14px", background: "transparent", textAlign: "left", transition: "background 0.1s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0, transition: "all 0.15s", background: c.visible ? c.color : "transparent", border: `2px solid ${c.color}` }} />
                    <span style={{ fontSize: 12.5, color: c.visible ? "var(--text)" : "var(--muted)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "0.5px solid var(--divider)", padding: "10px 14px" }}>
          <button className="btn sm" style={{ width: "100%" }} onClick={() => setConnectOpen(true)}>
            <I.Plus size={12} /> Add account
          </button>
        </div>
      </div>

      {/* ── Main calendar ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--divider)", flexShrink: 0 }}>
          <button className="btn sm" onClick={() => { setCurYear(todayDate.getFullYear()); setCurMonth(todayDate.getMonth()); setSelectedDay(todayDate.getDate()); }}>Today</button>
          <button className="iconbtn" onClick={() => goMonth(-1)}>
            <I.Chevron size={13} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button className="iconbtn" onClick={() => goMonth(1)}>
            <I.Chevron size={13} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{CAL_MONTHS[curMonth]} {curYear}</span>
          <div style={{ flex: 1 }} />
          <span className="dim" style={{ fontSize: 12 }}>{visibleCals.length} of {allCals.length} calendars shown</span>
          <button className="btn sm" onClick={() => setConnectOpen(true)}><I.Plus size={12} /> Connect</button>
        </div>

        {/* Month grid */}
        <MonthGrid year={curYear} month={curMonth} todayDate={todayDate} events={events} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
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

// ─────────────────────────────────────────────────────────────────
// Mini month picker in sidebar
// ─────────────────────────────────────────────────────────────────
function MiniMonthGrid({ year, month, todayDate, selectedDay, onSelect }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d && year === todayDate.getFullYear() && month === todayDate.getMonth() && d === todayDate.getDate();
  const isSel = (d) => d && d === selectedDay && year === todayDate.getFullYear() && month === todayDate.getMonth();

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 2 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", textAlign: "center", padding: "2px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {cells.map((d, i) => (
          <button key={i} onClick={() => d && onSelect(d)} style={{
            padding: "2px 0", fontSize: 10.5, textAlign: "center", borderRadius: 4,
            background: isToday(d) ? "var(--accent)" : isSel(d) ? "var(--surface-hi)" : "transparent",
            color: isToday(d) ? "var(--ink-on-accent)" : d ? "var(--text-2)" : "transparent",
            fontWeight: isToday(d) || isSel(d) ? 600 : 400,
            cursor: d ? "pointer" : "default",
          }}>{d ?? ""}</button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full month grid
// ─────────────────────────────────────────────────────────────────
function MonthGrid({ year, month, todayDate, events, selectedDay, onSelectDay }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDIM = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDIM - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  let nd = 1;
  while (cells.length % 7 !== 0) cells.push({ day: nd++, cur: false });

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isToday = (c) => c.cur && year === todayDate.getFullYear() && month === todayDate.getMonth() && c.day === todayDate.getDate();
  const isSel = (c) => c.cur && c.day === selectedDay;

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "0.5px solid var(--divider)", flexShrink: 0 }}>
        {CAL_DAYS.map((d, i) => (
          <div key={i} style={{ padding: "7px 10px", fontSize: 10.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderRight: i < 6 ? "0.5px solid var(--divider)" : "none" }}>{d}</div>
        ))}
      </div>
      {/* Weeks */}
      <div style={{ flex: 1, display: "grid", gridTemplateRows: `repeat(${weeks.length}, minmax(100px, 1fr))` }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: wi < weeks.length - 1 ? "0.5px solid var(--divider)" : "none" }}>
            {week.map((cell, di) => {
              const dayEvts = cell.cur ? events.filter(e => e.day === cell.day) : [];
              return (
                <div key={di}
                  onClick={() => cell.cur && onSelectDay(cell.day)}
                  style={{
                    padding: "7px 8px 5px",
                    borderRight: di < 6 ? "0.5px solid var(--divider)" : "none",
                    background: isSel(cell) ? "color-mix(in oklab, var(--accent) 7%, transparent)" : "transparent",
                    cursor: cell.cur ? "pointer" : "default",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (cell.cur && !isSel(cell)) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={(e) => { if (!isSel(cell)) e.currentTarget.style.background = "transparent"; }}>
                  {/* Day number */}
                  <div style={{ marginBottom: 3, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: isToday(cell) ? "var(--accent)" : "transparent",
                    fontSize: 12, fontWeight: isToday(cell) ? 700 : 400,
                    color: isToday(cell) ? "var(--ink-on-accent)" : cell.cur ? "var(--text)" : "var(--muted)" }}>
                    {cell.day}
                  </div>
                  {/* Events */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {dayEvts.slice(0, 3).map(ev => (
                      <div key={ev.id} style={{
                        padding: "1px 5px", borderRadius: 3, fontSize: 11, lineHeight: 1.6,
                        background: "color-mix(in oklab, " + ev.color + " 18%, var(--surface))",
                        borderLeft: "2px solid " + ev.color,
                        color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{ev.title}</div>
                    ))}
                    {dayEvts.length > 3 && <div style={{ fontSize: 10.5, color: "var(--muted)", paddingLeft: 3 }}>+{dayEvts.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
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
          const on = picked[c.id] !== false;
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
