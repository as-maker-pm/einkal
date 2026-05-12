// screens-calendars.jsx — Calendar with Day/Week/Month views + event panel

const { useState: useStateC, useEffect: useEffectC, useMemo: useMemoC, useRef: useRefC } = React;

const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DAYS_FULL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const CAL_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const CELL_H = 56;
const HR_S = 7;
const HR_E = 22;
const TZ_W = 54;
const BASE_TZ = { id:"est", abbr:"EST", city:"New York", offset:-5 };
const ALL_TZ = [
  { id:"pst",  abbr:"PST",  city:"Los Angeles", offset:-8 },
  { id:"mst",  abbr:"MST",  city:"Denver",      offset:-7 },
  { id:"cst",  abbr:"CST",  city:"Chicago",     offset:-6 },
  { id:"brt",  abbr:"BRT",  city:"São Paulo",   offset:-3 },
  { id:"gmt",  abbr:"GMT",  city:"London",      offset: 0 },
  { id:"cet",  abbr:"CET",  city:"Paris",       offset: 1 },
  { id:"msk",  abbr:"MSK",  city:"Moscow",      offset: 3 },
  { id:"ist",  abbr:"IST",  city:"Mumbai",      offset: 5.5 },
  { id:"cst8", abbr:"CST",  city:"Shanghai",    offset: 8 },
  { id:"jst",  abbr:"JST",  city:"Tokyo",       offset: 9 },
  { id:"aest", abbr:"AEST", city:"Sydney",      offset:10 },
];

const EV_TYPES  = ["busy","busy","busy","skipped","double-booked","mirror"];
const EV_TITLES = ["Standup","1:1","Review","Client call","Planning","Sprint sync","Interview","Demo","Workshop","Deep work","Brainstorm","Strategy","Code review","Design sync","All-hands","Lunch","Check-in","Kickoff","Retrospective"];

const CONF_OPTIONS = [
  { id:"meet",     label:"Google Meet" },
  { id:"zoom",     label:"Zoom"        },
  { id:"teams",    label:"Teams"       },
  { id:"phone",    label:"Phone"       },
  { id:"inperson", label:"In person"   },
];
const REMINDER_OPTIONS = [
  { id:"5min",  label:"5 min before"  },
  { id:"10min", label:"10 min before" },
  { id:"15min", label:"15 min before" },
  { id:"30min", label:"30 min before" },
  { id:"1hr",   label:"1 hr before"   },
  { id:"1day",  label:"1 day before"  },
];
const REPEAT_OPTIONS = [
  { value:"none",     label:"Does not repeat" },
  { value:"daily",    label:"Every day"       },
  { value:"weekly",   label:"Every week"      },
  { value:"biweekly", label:"Every 2 weeks"   },
  { value:"monthly",  label:"Every month"     },
  { value:"yearly",   label:"Every year"      },
];

function seedRand(n) {
  let s = (n | 0) || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 15;
    return (s >>> 0) / 4294967296;
  };
}

function fmtH(h) {
  const hh = ((h % 24) + 24) % 24;
  const hr = Math.floor(hh);
  const mm = Math.round((hh - hr) * 60);
  const ap = hr < 12 ? "am" : "pm";
  const h12 = hr % 12 || 12;
  return mm === 0 ? `${h12}${ap}` : `${h12}:${String(mm).padStart(2,"0")}${ap}`;
}

function tzAdjH(h, tz) {
  return ((h + tz.offset - BASE_TZ.offset) % 24 + 24) % 24;
}

function getWeekDates(year, month, day) {
  const d = new Date(year, month, day);
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return { year: dd.getFullYear(), month: dd.getMonth(), day: dd.getDate() };
  });
}

// Time picker options — every 30 min
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const v = h + m / 60;
      opts.push({ value: v, label: fmtH(v) });
    }
  }
  return opts;
})();

function genMonthEvents(cal, year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seed = cal.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0) + year*13 + month*31;
  const rng = seedRand(seed);
  const count = 4 + Math.floor(rng() * 7);
  const used = new Set();
  const evts = [];
  for (let i = 0; i < count; i++) {
    let day, tries = 0;
    do { day = 1 + Math.floor(rng() * daysInMonth); tries++; } while (used.has(day) && tries < 20);
    used.add(day);
    evts.push({ id:`${cal.id}-e${i}`, day, title:EV_TITLES[Math.floor(rng()*EV_TITLES.length)], color:cal.color, calName:cal.name, type:EV_TYPES[Math.floor(rng()*EV_TYPES.length)] });
  }
  return evts;
}

function genDayEvents(cal, year, month, day) {
  const seed = cal.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0) + year*10000 + month*100 + day;
  const rng = seedRand(seed);
  const count = 1 + Math.floor(rng() * 4);
  const durs = [0.5, 1, 1, 1.5, 2];
  return Array.from({ length: count }, (_, i) => ({
    id: `${cal.id}-${year}${month}${day}-e${i}`,
    title: EV_TITLES[Math.floor(rng()*EV_TITLES.length)],
    color: cal.color, calName: cal.name,
    sh: HR_S + Math.floor(rng() * (HR_E - HR_S - 2)),
    dur: durs[Math.floor(rng()*durs.length)],
    type: EV_TYPES[Math.floor(rng()*EV_TYPES.length)],
  }));
}

function layoutEvents(evts) {
  if (!evts.length) return [];
  const sorted = [...evts].sort((a,b) => a.sh - b.sh);
  const colEnds = [];
  const assigned = sorted.map(ev => {
    let ci = 0;
    while (colEnds[ci] !== undefined && colEnds[ci] > ev.sh + 0.01) ci++;
    colEnds[ci] = ev.sh + ev.dur;
    return ci;
  });
  const totalCols = colEnds.length;
  return sorted.map((ev, i) => ({ ...ev, ci: assigned[i], totalCols }));
}

// ─────────────────────────────────────────────────────────────────
function CalendarsScreen() {
  const { state, updateCalendar, addAccount, pushActivity } = useStore();
  const toast = useToast();
  const [connectOpen, setConnectOpen] = useStateC(false);
  const [view, setView] = useStateC("month");
  const [extraTzs, setExtraTzs] = useStateC([]);
  const [tzPickerOpen, setTzPickerOpen] = useStateC(false);
  const todayDate = new Date(2026, 4, 12);
  const [curYear, setCurYear] = useStateC(2026);
  const [curMonth, setCurMonth] = useStateC(4);
  const [curDay, setCurDay] = useStateC(12);

  // Event panel
  const [panelMode, setPanelMode] = useStateC(null); // null | "create" | "view" | "edit"
  const [panelSlot, setPanelSlot] = useStateC(null);
  const [panelEvent, setPanelEvent] = useStateC(null);
  const [localEvents, setLocalEvents] = useStateC([]);

  const tzList = [BASE_TZ, ...extraTzs];
  const allCals = useMemoC(() => state.accounts.flatMap(a => a.calendars.map(c => ({ ...c, account: a }))), [state.accounts]);
  const visibleCals = allCals.filter(c => c.visible);

  const goToday = () => { setCurYear(todayDate.getFullYear()); setCurMonth(todayDate.getMonth()); setCurDay(todayDate.getDate()); };

  const goPrev = () => {
    if (view==="month") { const nm=curMonth-1; if(nm<0){setCurYear(y=>y-1);setCurMonth(11);}else setCurMonth(nm); }
    else if (view==="week") { const d=new Date(curYear,curMonth,curDay-7); setCurYear(d.getFullYear());setCurMonth(d.getMonth());setCurDay(d.getDate()); }
    else { const d=new Date(curYear,curMonth,curDay-1); setCurYear(d.getFullYear());setCurMonth(d.getMonth());setCurDay(d.getDate()); }
  };
  const goNext = () => {
    if (view==="month") { const nm=curMonth+1; if(nm>11){setCurYear(y=>y+1);setCurMonth(0);}else setCurMonth(nm); }
    else if (view==="week") { const d=new Date(curYear,curMonth,curDay+7); setCurYear(d.getFullYear());setCurMonth(d.getMonth());setCurDay(d.getDate()); }
    else { const d=new Date(curYear,curMonth,curDay+1); setCurYear(d.getFullYear());setCurMonth(d.getMonth());setCurDay(d.getDate()); }
  };

  const navLabel = useMemoC(() => {
    if (view==="month") return `${CAL_MONTHS[curMonth]} ${curYear}`;
    if (view==="week") {
      const dates = getWeekDates(curYear, curMonth, curDay);
      const f=dates[0], l=dates[6];
      return f.month===l.month ? `${CAL_MONTHS[f.month].slice(0,3)} ${f.day} – ${l.day}, ${l.year}` : `${CAL_MONTHS[f.month].slice(0,3)} ${f.day} – ${CAL_MONTHS[l.month].slice(0,3)} ${l.day}, ${l.year}`;
    }
    return `${CAL_DAYS_FULL[new Date(curYear,curMonth,curDay).getDay()]}, ${CAL_MONTHS[curMonth].slice(0,3)} ${curDay}, ${curYear}`;
  }, [view, curYear, curMonth, curDay]);

  const goDay = (y, m, d) => { setCurYear(y); setCurMonth(m); setCurDay(d); setView("day"); };

  // Panel handlers
  const openCreate = (date, startH, endH) => {
    setPanelSlot({ year:date.year, month:date.month, day:date.day, startH, endH });
    setPanelEvent(null);
    setPanelMode("create");
  };
  const openView = (ev) => { setPanelEvent(ev); setPanelSlot(null); setPanelMode("view"); };
  const closePanel = () => setPanelMode(null);
  const saveEvent = (data) => {
    setLocalEvents(evs => [...evs, { ...data, id:"local-"+Math.random().toString(36).slice(2,8), type:"busy", isLocal:true }]);
    setPanelMode(null);
  };
  const updateEvent = (id, data) => {
    setLocalEvents(evs => evs.map(e => e.id===id ? { ...e, ...data } : e));
    setPanelMode(null);
  };
  const deleteEvent = (id) => { setLocalEvents(evs => evs.filter(e => e.id!==id)); setPanelMode(null); };
  const duplicateEvent = (ev) => { saveEvent({ ...ev, title: ev.title + " (copy)", isLocal:true }); };

  const weekDates = useMemoC(() => getWeekDates(curYear, curMonth, curDay), [curYear, curMonth, curDay]);
  const dayDates  = useMemoC(() => [{ year:curYear, month:curMonth, day:curDay }], [curYear, curMonth, curDay]);
  const availableTzs = ALL_TZ.filter(t => !tzList.find(e => e.id === t.id));

  const gridProps = { todayDate, visibleCals, tzList, onRemoveTz:id=>setExtraTzs(e=>e.filter(t=>t.id!==id)), onAddTz:()=>setTzPickerOpen(true), canAddTz:extraTzs.length<2, onDayClick:goDay, onSlotClick:openCreate, onEventClick:openView, localEvents };

  return (
    <div style={{ height:"100%", display:"flex", overflow:"hidden" }}>
      <CalSidebar state={state} updateCalendar={updateCalendar} curYear={curYear} curMonth={curMonth} todayDate={todayDate} selectedDay={curDay}
        onSelectDay={d => setCurDay(d)} onMonthChange={(y,m) => { setCurYear(y); setCurMonth(m); }} onAddAccount={() => setConnectOpen(true)} />

      {/* Event panel */}
      {panelMode && (
        <EventPanel
          mode={panelMode} slot={panelSlot} event={panelEvent}
          calendars={visibleCals}
          onClose={closePanel} onSave={saveEvent} onUpdate={updateEvent}
          onDelete={deleteEvent} onDuplicate={duplicateEvent}
          onStartEdit={() => setPanelMode("edit")}
        />
      )}

      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
        {/* Toolbar */}
        <div style={{ padding:"8px 16px", display:"flex", alignItems:"center", gap:8, borderBottom:"0.5px solid var(--divider)", flexShrink:0 }}>
          <button className="btn sm" onClick={goToday}>Today</button>
          <button className="iconbtn" onClick={goPrev}><I.Chevron size={13} style={{ transform:"rotate(180deg)" }} /></button>
          <button className="iconbtn" onClick={goNext}><I.Chevron size={13} /></button>
          <span style={{ fontSize:14, fontWeight:500 }}>{navLabel}</span>
          <div style={{ flex:1 }} />
          <Segmented value={view} onChange={setView} size="sm"
            options={[{value:"month",label:"Month"},{value:"week",label:"Week"},{value:"day",label:"Day"}]} />
        </div>

        {view==="month" && <MonthView year={curYear} month={curMonth} todayDate={todayDate} selectedDay={curDay} visibleCals={visibleCals} localEvents={localEvents} onDayClick={d => { setCurDay(d); setView("day"); }} onEventClick={openView} />}
        {view==="week" && <WeekDayGrid {...gridProps} dates={weekDates} singleDay={false} />}
        {view==="day"  && <WeekDayGrid {...gridProps} dates={dayDates}  singleDay={true}  />}

        {tzPickerOpen && (
          <div style={{ position:"fixed", inset:0, zIndex:300 }} onClick={() => setTzPickerOpen(false)}>
            <div style={{ position:"fixed", left:230, top:110, width:200, maxHeight:260, overflow:"auto", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:10, boxShadow:"0 8px 32px rgba(0,0,0,0.2)", padding:"6px 0", zIndex:301 }} onClick={e=>e.stopPropagation()}>
              <div style={{ padding:"8px 12px 5px", fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:"0.06em", textTransform:"uppercase" }}>Add timezone</div>
              {availableTzs.map(tz => (
                <button key={tz.id} onClick={() => { setExtraTzs(e=>[...e,tz]); setTzPickerOpen(false); }}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"7px 12px", background:"transparent", textAlign:"left", transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface-hi)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:11, fontWeight:700, width:34 }}>{tz.abbr}</span>
                  <span style={{ fontSize:11, color:"var(--dim)" }}>{tz.city}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConnectModal open={connectOpen} onClose={() => setConnectOpen(false)} onConnect={acc => {
        addAccount(acc); pushActivity(`Connected ${acc.email}`, "connect");
        toast(`Connected ${acc.email}`, "ok"); setConnectOpen(false);
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Event Panel — create / view / edit
// ─────────────────────────────────────────────────────────────────
function EventPanel({ mode, slot, event, calendars, onClose, onSave, onUpdate, onDelete, onDuplicate, onStartEdit }) {
  const isCreate = mode === "create";
  const isEdit   = mode === "edit";
  const isView   = mode === "view";

  const initCal = (isCreate || isEdit) ? (event?.calId || calendars[0]?.id || "") : "";
  const initSlot = isCreate ? slot : (event ? { year:event.year, month:event.month, day:event.day, startH:event.startH||10, endH:event.endH||11 } : { year:2026,month:4,day:12,startH:10,endH:11 });

  const [title,       setTitle]       = useStateC(event?.title       || "");
  const [calId,       setCalId]       = useStateC(event?.calId       || calendars[0]?.id || "");
  const [dateStr,     setDateStr]     = useStateC(`${initSlot.year}-${String(initSlot.month+1).padStart(2,"0")}-${String(initSlot.day).padStart(2,"0")}`);
  const [startH,      setStartH]      = useStateC(initSlot.startH);
  const [endH,        setEndH]        = useStateC(initSlot.endH);
  const [tzId,        setTzId]        = useStateC(event?.tzId        || "est");
  const [desc,        setDesc]        = useStateC(event?.desc        || "");
  const [guests,      setGuests]      = useStateC(event?.participants || []);
  const [guestInput,  setGuestInput]  = useStateC("");
  const [conferencing,setConferencing]= useStateC(event?.conferencing || "meet");
  const [reminders,   setReminders]   = useStateC(event?.reminders   || ["10min"]);
  const [repeat,      setRepeat]      = useStateC(event?.repeat      || "none");
  const [addRemOpen,  setAddRemOpen]  = useStateC(false);

  const selCal = calendars.find(c => c.id === calId) || calendars[0];

  const addGuest = () => {
    const g = guestInput.trim();
    if (g && g.includes("@")) { setGuests(gs => [...gs, g]); setGuestInput(""); }
  };

  const handleSave = () => {
    const parts = dateStr.split("-");
    const y = parseInt(parts[0]), m = parseInt(parts[1])-1, d = parseInt(parts[2]);
    const data = { title:title||"Untitled", calId:selCal?.id, calColor:selCal?.color, calName:selCal?.name, year:y, month:m, day:d, startH, endH, tzId, desc, participants:guests, conferencing, reminders, repeat };
    if (isEdit && event?.id) onUpdate(event.id, data);
    else onSave(data);
  };

  // View mode
  if (isView) {
    const tz = [BASE_TZ, ...ALL_TZ].find(t => t.id === event?.tzId) || BASE_TZ;
    const conf = CONF_OPTIONS.find(c => c.id === event?.conferencing);
    return (
      <div style={{ width:300, flexShrink:0, borderRight:"0.5px solid var(--divider)", display:"flex", flexDirection:"column", background:"var(--bg-1)", overflow:"hidden" }}>
        <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:"0.5px solid var(--divider)" }}>
          {event?.isLocal && <button className="btn sm" onClick={onStartEdit}><I.Edit size={12} /> Edit</button>}
          <div style={{ flex:1 }} />
          <button className="iconbtn" onClick={onClose}><I.X size={14} /></button>
        </div>
        <div style={{ flex:1, overflow:"auto", padding:"18px 16px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:16 }}>
            <span style={{ width:12, height:12, borderRadius:"50%", background:event?.calColor||event?.color||"var(--accent)", flexShrink:0, marginTop:3 }} />
            <h2 style={{ fontSize:17, fontWeight:600, lineHeight:1.3, margin:0 }}>{event?.title || "Event"}</h2>
          </div>
          <InfoRow icon={<I.Clock size={13} />}>
            <div style={{ fontSize:13 }}>{CAL_DAYS_FULL[new Date(event.year,event.month,event.day).getDay()]}, {CAL_MONTHS[event.month].slice(0,3)} {event.day}</div>
            <div style={{ fontSize:12, color:"var(--dim)" }}>{fmtH(event.startH||10)} – {fmtH(event.endH||11)} · {tz.abbr}</div>
          </InfoRow>
          {event?.calName && <InfoRow icon={<I.Calendar size={13} />}><div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13 }}><span style={{ width:8, height:8, borderRadius:"50%", background:event.calColor }} />{event.calName}</div></InfoRow>}
          {event?.desc && <div style={{ marginBottom:12, padding:"10px 12px", background:"var(--surface)", borderRadius:8, fontSize:12.5, color:"var(--text-2)", lineHeight:1.5 }}>{event.desc}</div>}
          {event?.participants?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Guests ({event.participants.length})</div>
              {event.participants.map((g,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:12.5 }}>
                  <Avatar name={g.split("@")[0]} size={20} /><span style={{ color:"var(--text-2)" }}>{g}</span>
                </div>
              ))}
            </div>
          )}
          {event?.conferencing && event.conferencing!=="none" && (
            <div style={{ marginBottom:16, padding:"10px 12px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:500 }}>{conf?.label||"Video call"}</div><div style={{ fontSize:11, color:"var(--muted)" }}>Link ready</div></div>
              <button className="btn sm"><I.Copy size={11} /> Copy</button>
            </div>
          )}
          <div style={{ height:"0.5px", background:"var(--divider)", margin:"4px 0 10px" }} />
          {[
            event?.isLocal && { label:"Block on another calendar", icon:<I.Lock size={13} />, action:()=>{} },
            { label:"Duplicate event", icon:<I.Copy size={13} />, action:()=>onDuplicate(event) },
            event?.isLocal && { label:"Delete event", icon:<I.Trash size={13} />, action:()=>onDelete(event.id), danger:true },
          ].filter(Boolean).map((ac,i) => (
            <button key={i} onClick={ac.action} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:7, fontSize:12.5, color:ac.danger?"var(--danger)":"var(--text-2)", width:"100%", textAlign:"left" }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{ color:ac.danger?"var(--danger)":"var(--dim)" }}>{ac.icon}</span>{ac.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Create / Edit form
  return (
    <div style={{ width:300, flexShrink:0, borderRight:"0.5px solid var(--divider)", display:"flex", flexDirection:"column", background:"var(--bg-1)", overflow:"hidden" }}>
      <div style={{ padding:"11px 14px", display:"flex", alignItems:"center", borderBottom:"0.5px solid var(--divider)" }}>
        <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{isEdit ? "Edit event" : "New event"}</span>
        <button className="iconbtn" onClick={onClose}><I.X size={14} /></button>
      </div>

      <div style={{ flex:1, overflow:"auto", padding:"16px 14px" }}>
        {/* Title */}
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Event title" autoFocus
          style={{ width:"100%", fontSize:17, fontWeight:600, background:"transparent", border:"none", outline:"none", color:"var(--text)", padding:"0 0 14px", borderBottom:"0.5px solid var(--divider)", marginBottom:14, boxSizing:"border-box" }} />

        {/* Calendar */}
        <FormSection label="Calendar">
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {calendars.map(c => (
              <button key={c.id} onClick={()=>setCalId(c.id)} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11.5, background:calId===c.id?`color-mix(in oklab,${c.color} 20%,var(--surface))`:"var(--surface)", border:`1.5px solid ${calId===c.id?c.color:"var(--border)"}`, color:"var(--text)", transition:"all 0.1s" }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:c.color }} />{c.name}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Date & Time */}
        <FormSection label="Date & time">
          <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} style={{ width:"100%", padding:"6px 8px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:7, fontSize:12, color:"var(--text)", outline:"none", marginBottom:6, boxSizing:"border-box" }} />
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <select value={startH} onChange={e=>{const v=parseFloat(e.target.value);setStartH(v);if(endH<=v)setEndH(v+1);}} style={{ flex:1, padding:"6px 8px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:7, fontSize:12, color:"var(--text)", outline:"none" }}>
              {TIME_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span style={{ color:"var(--muted)", fontSize:11 }}>→</span>
            <select value={endH} onChange={e=>setEndH(parseFloat(e.target.value))} style={{ flex:1, padding:"6px 8px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:7, fontSize:12, color:"var(--text)", outline:"none" }}>
              {TIME_OPTIONS.filter(o=>o.value>startH).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <select value={tzId} onChange={e=>setTzId(e.target.value)} style={{ marginTop:4, width:"100%", padding:"5px 8px", background:"transparent", border:"none", borderRadius:6, fontSize:11, color:"var(--muted)", outline:"none", cursor:"pointer" }}>
            {[BASE_TZ,...ALL_TZ].map(tz=><option key={tz.id} value={tz.id}>{tz.abbr} – {tz.city}</option>)}
          </select>
        </FormSection>

        <div style={{ height:"0.5px", background:"var(--divider)", margin:"0 0 14px" }} />

        {/* Description */}
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Add description…" rows={2}
          style={{ width:"100%", padding:"8px 10px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, fontSize:12.5, color:"var(--text)", outline:"none", resize:"vertical", lineHeight:1.5, boxSizing:"border-box", marginBottom:14 }} />

        <div style={{ height:"0.5px", background:"var(--divider)", margin:"0 0 14px" }} />

        {/* Guests */}
        <FormSection label="Guests">
          <div style={{ display:"flex", gap:5, marginBottom:6 }}>
            <input value={guestInput} onChange={e=>setGuestInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();addGuest();}}}
              placeholder="Add email, press Enter" style={{ flex:1, padding:"6px 10px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:7, fontSize:12, color:"var(--text)", outline:"none" }} />
            <button className="btn sm" onClick={addGuest}><I.Plus size={12} /></button>
          </div>
          {guests.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {guests.map((g,i) => (
                <span key={i} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:20, fontSize:11 }}>
                  <Avatar name={g.split("@")[0]} size={13} />
                  <span style={{ maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g}</span>
                  <button onClick={()=>setGuests(gg=>gg.filter((_,ii)=>ii!==i))} style={{ color:"var(--muted)", lineHeight:1 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </FormSection>

        <div style={{ height:"0.5px", background:"var(--divider)", margin:"0 0 14px" }} />

        {/* Conferencing */}
        <FormSection label="Conferencing">
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {CONF_OPTIONS.map(c => (
              <button key={c.id} onClick={()=>setConferencing(c.id)} style={{ padding:"4px 10px", borderRadius:20, fontSize:11.5, background:conferencing===c.id?"var(--accent)":"var(--surface)", color:conferencing===c.id?"var(--ink-on-accent)":"var(--text-2)", border:`1.5px solid ${conferencing===c.id?"var(--accent)":"var(--border)"}`, transition:"all 0.1s" }}>
                {c.label}
              </button>
            ))}
          </div>
        </FormSection>

        <div style={{ height:"0.5px", background:"var(--divider)", margin:"0 0 14px" }} />

        {/* Reminders */}
        <FormSection label="Reminders" right={
          <div style={{ position:"relative" }}>
            <button className="btn ghost sm" style={{ height:20, padding:"0 6px", fontSize:10 }} onClick={()=>setAddRemOpen(o=>!o)}>+ Add</button>
            {addRemOpen && (
              <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", background:"var(--panel)", border:"0.5px solid var(--border)", borderRadius:8, padding:"4px 0", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", zIndex:10, width:160 }}>
                {REMINDER_OPTIONS.filter(r=>!reminders.includes(r.id)).map(r => (
                  <button key={r.id} onClick={()=>{setReminders(rs=>[...rs,r.id]);setAddRemOpen(false);}} style={{ width:"100%", padding:"7px 12px", textAlign:"left", fontSize:12, background:"transparent", color:"var(--text-2)" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--hover)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{r.label}</button>
                ))}
              </div>
            )}
          </div>
        }>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {reminders.map(r => {
              const opt = REMINDER_OPTIONS.find(o=>o.id===r);
              return (
                <span key={r} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:20, fontSize:11 }}>
                  <I.Bell size={10} />{opt?.label||r}
                  <button onClick={()=>setReminders(rs=>rs.filter(x=>x!==r))} style={{ color:"var(--muted)", lineHeight:1 }}>×</button>
                </span>
              );
            })}
          </div>
        </FormSection>

        {/* Repeat */}
        <FormSection label="Repeat">
          <select value={repeat} onChange={e=>setRepeat(e.target.value)} style={{ width:"100%", padding:"7px 10px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, fontSize:12.5, color:"var(--text)", outline:"none" }}>
            {REPEAT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FormSection>
      </div>

      <div style={{ padding:"11px 14px", borderTop:"0.5px solid var(--divider)", display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={handleSave}><I.Check size={13} /> {isEdit ? "Save" : "Create"}</button>
      </div>
    </div>
  );
}

function InfoRow({ icon, children }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:10 }}>
      <span style={{ color:"var(--dim)", marginTop:2, flexShrink:0 }}>{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function FormSection({ label, children, right }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", marginBottom:7 }}>
        <label style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 }}>{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function CalSidebar({ state, updateCalendar, curYear, curMonth, todayDate, selectedDay, onSelectDay, onMonthChange, onAddAccount }) {
  const goMonth = d => {
    const nm = curMonth + d;
    if (nm < 0) onMonthChange(curYear-1, 11);
    else if (nm > 11) onMonthChange(curYear+1, 0);
    else onMonthChange(curYear, nm);
  };
  return (
    <div style={{ width:210, flexShrink:0, borderRight:"0.5px solid var(--divider)", display:"flex", flexDirection:"column", background:"var(--bg-1)" }}>
      <div style={{ padding:"16px 14px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <button className="iconbtn" onClick={() => goMonth(-1)} style={{ width:22, height:22 }}><I.Chevron size={12} style={{ transform:"rotate(180deg)" }} /></button>
          <span style={{ fontSize:12, fontWeight:600 }}>{CAL_MONTHS[curMonth].slice(0,3)} {curYear}</span>
          <button className="iconbtn" onClick={() => goMonth(1)} style={{ width:22, height:22 }}><I.Chevron size={12} /></button>
        </div>
        <MiniMonthGrid year={curYear} month={curMonth} todayDate={todayDate} selectedDay={selectedDay} onSelect={onSelectDay} />
      </div>
      <div style={{ height:"0.5px", background:"var(--divider)" }} />
      <div style={{ flex:1, overflow:"auto", padding:"10px 0" }}>
        {state.accounts.map(acc => {
          const Mark = acc.provider==="google" ? Provider.Google : Provider.Microsoft;
          return (
            <div key={acc.id} style={{ marginBottom:12 }}>
              <div style={{ padding:"4px 14px 5px", display:"flex", alignItems:"center", gap:6 }}>
                <Mark size={10} />
                <span style={{ fontSize:10, fontWeight:700, color:"var(--muted)", letterSpacing:"0.06em", textTransform:"uppercase", flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{acc.label}</span>
              </div>
              {acc.calendars.map(c => (
                <button key={c.id} onClick={() => updateCalendar(c.id, { visible:!c.visible })}
                  style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"4px 14px", background:"transparent", textAlign:"left", transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ width:11, height:11, borderRadius:3, flexShrink:0, background:c.visible?c.color:"transparent", border:`2px solid ${c.color}`, transition:"all 0.15s" }} />
                  <span style={{ fontSize:12.5, color:c.visible?"var(--text)":"var(--muted)", flex:1, minWidth:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ borderTop:"0.5px solid var(--divider)", padding:"10px 14px" }}>
        <button className="btn sm" style={{ width:"100%" }} onClick={onAddAccount}><I.Plus size={12} /> Add account</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function MiniMonthGrid({ year, month, todayDate, selectedDay, onSelect }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const isToday = d => d && year===todayDate.getFullYear() && month===todayDate.getMonth() && d===todayDate.getDate();
  const isSel   = d => d && d===selectedDay && year===todayDate.getFullYear() && month===todayDate.getMonth();
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", marginBottom:2 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} style={{ fontSize:9, fontWeight:600, color:"var(--muted)", textAlign:"center", padding:"2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:1 }}>
        {cells.map((d,i) => (
          <button key={i} onClick={() => d && onSelect(d)} style={{ padding:"2px 0", fontSize:10.5, textAlign:"center", borderRadius:4, background:isToday(d)?"var(--accent)":isSel(d)?"var(--surface-hi)":"transparent", color:isToday(d)?"var(--ink-on-accent)":d?"var(--text-2)":"transparent", fontWeight:isToday(d)||isSel(d)?600:400, cursor:d?"pointer":"default" }}>{d??""}</button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function MonthView({ year, month, todayDate, selectedDay, visibleCals, localEvents, onDayClick, onEventClick }) {
  const genEvents = useMemoC(() => visibleCals.flatMap(c => genMonthEvents(c, year, month)), [visibleCals, year, month]);
  const allEvents = useMemoC(() => {
    const locMonth = (localEvents||[]).filter(e => e.year===year && e.month===month);
    return [...genEvents, ...locMonth.map(e => ({ ...e, isLocal:true }))];
  }, [genEvents, localEvents, year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDIM = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay-1; i >= 0; i--) cells.push({ day:prevDIM-i, cur:false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day:d, cur:true });
  let nd = 1;
  while (cells.length % 7 !== 0) cells.push({ day:nd++, cur:false });
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));
  const isToday = c => c.cur && year===todayDate.getFullYear() && month===todayDate.getMonth() && c.day===todayDate.getDate();
  const isSel = c => c.cur && c.day===selectedDay;
  return (
    <div style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", borderBottom:"0.5px solid var(--divider)", flexShrink:0 }}>
        {CAL_DAYS.map((d,i) => <div key={i} style={{ padding:"7px 10px", fontSize:10.5, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em", borderRight:i<6?"0.5px solid var(--divider)":"none" }}>{d}</div>)}
      </div>
      <div style={{ flex:1, display:"grid", gridTemplateRows:`repeat(${weeks.length}, minmax(100px, 1fr))` }}>
        {weeks.map((week,wi) => (
          <div key={wi} style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", borderBottom:wi<weeks.length-1?"0.5px solid var(--divider)":"none" }}>
            {week.map((cell,di) => {
              const dayEvts = cell.cur ? allEvents.filter(e => e.day===cell.day) : [];
              return (
                <div key={di} onClick={() => cell.cur && onDayClick(cell.day)}
                  style={{ padding:"7px 8px 5px", borderRight:di<6?"0.5px solid var(--divider)":"none", background:isSel(cell)?"color-mix(in oklab, var(--accent) 7%, transparent)":"transparent", cursor:cell.cur?"pointer":"default", transition:"background 0.1s" }}
                  onMouseEnter={e => { if(cell.cur&&!isSel(cell)) e.currentTarget.style.background="var(--surface)"; }}
                  onMouseLeave={e => { if(!isSel(cell)) e.currentTarget.style.background="transparent"; }}>
                  <div style={{ marginBottom:3, width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:isToday(cell)?"var(--accent)":"transparent", fontSize:12, fontWeight:isToday(cell)?700:400, color:isToday(cell)?"var(--ink-on-accent)":cell.cur?"var(--text)":"var(--muted)" }}>{cell.day}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    {dayEvts.slice(0,3).map(ev => <MonthEvent key={ev.id} ev={ev} onClick={e => { e.stopPropagation(); onEventClick?.(ev); }} />)}
                    {dayEvts.length > 3 && <div style={{ fontSize:10.5, color:"var(--muted)", paddingLeft:3 }}>+{dayEvts.length-3} more</div>}
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

function MonthEvent({ ev, onClick }) {
  const base = { padding:"1px 5px", borderRadius:3, fontSize:11, lineHeight:1.6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", cursor:"pointer" };
  if (ev.type==="skipped") return <div style={{ ...base, background:"var(--surface)", border:"1px dashed var(--border)", color:"var(--muted)", textDecoration:"line-through" }} onClick={onClick}>{ev.title}</div>;
  if (ev.type==="double-booked") return <div style={{ ...base, background:`color-mix(in oklab,${ev.color} 18%,var(--surface))`, borderLeft:`2px solid ${ev.color}`, color:"var(--text-2)", display:"flex", alignItems:"center", gap:3, padding:"1px 4px" }} onClick={onClick}><span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis" }}>{ev.title}</span><span style={{ width:6,height:6,borderRadius:"50%",background:"#e53e3e",flexShrink:0 }} /></div>;
  if (ev.type==="mirror") return <div style={{ ...base, background:`color-mix(in oklab,${ev.color} 8%,var(--surface))`, borderLeft:`2px solid ${ev.color}`, color:"var(--muted)", opacity:0.75 }} onClick={onClick}>{ev.title}</div>;
  return <div style={{ ...base, background:`color-mix(in oklab,${ev.color} 18%,var(--surface))`, borderLeft:`2px solid ${ev.color}`, color:"var(--text-2)" }} onClick={onClick}>{ev.title}</div>;
}

// ─────────────────────────────────────────────────────────────────
// Shared Week / Day grid with drag-to-create
// ─────────────────────────────────────────────────────────────────
function WeekDayGrid({ dates, todayDate, visibleCals, tzList, onRemoveTz, onAddTz, canAddTz, onDayClick, onSlotClick, onEventClick, localEvents, singleDay }) {
  const isToday = d => d.year===todayDate.getFullYear() && d.month===todayDate.getMonth() && d.day===todayDate.getDate();
  const hours = useMemoC(() => { const h=[]; for(let i=HR_S;i<=HR_E;i++) h.push(i); return h; }, []);

  // Drag selection
  const selRef = useRefC(null);
  const [sel, setSel] = useStateC(null);

  const handleDragStart = (colIdx, date, h) => {
    const s = { colIdx, date, startH:h, endH:h+1 };
    selRef.current = s;
    setSel(s);
  };
  const handleDragExtend = (colIdx, h) => {
    if (!selRef.current || selRef.current.colIdx !== colIdx) return;
    const s = { ...selRef.current, endH: Math.max(h+1, selRef.current.startH+1) };
    selRef.current = s;
    setSel(s);
  };

  useEffectC(() => {
    const up = () => {
      const s = selRef.current;
      if (s) onSlotClick?.(s.date, s.startH, s.endH);
      selRef.current = null;
      setSel(null);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  const eventsByDate = useMemoC(() => {
    const map = {};
    for (const d of dates) {
      const key = `${d.year}-${d.month}-${d.day}`;
      const genEvts = visibleCals.flatMap(c => genDayEvents(c, d.year, d.month, d.day));
      const locEvts = (localEvents||[]).filter(e => e.year===d.year && e.month===d.month && e.day===d.day).map(e => ({ ...e, sh:e.startH, dur:e.endH-e.startH }));
      map[key] = layoutEvents([...genEvts, ...locEvts]);
    }
    return map;
  }, [dates, visibleCals, localEvents]);

  const leftW = tzList.length * TZ_W + (canAddTz ? 26 : 0);
  const DOW_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", flexShrink:0, borderBottom:"0.5px solid var(--divider)" }}>
        <div style={{ width:leftW, flexShrink:0, display:"flex", borderRight:"0.5px solid var(--divider)" }}>
          {tzList.map((tz,ti) => (
            <div key={tz.id} style={{ width:TZ_W, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 2px", borderRight:ti<tzList.length-1?"0.5px solid var(--divider)":"none", position:"relative" }}>
              {ti>0 && <button onClick={()=>onRemoveTz(tz.id)} style={{ position:"absolute", top:3, right:3, width:14, height:14, borderRadius:"50%", background:"var(--surface-hi)", fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)" }}>×</button>}
              <span style={{ fontSize:10, fontWeight:700 }}>{tz.abbr}</span>
              <span style={{ fontSize:9, color:"var(--muted)", marginTop:1 }}>{tz.city}</span>
            </div>
          ))}
          {canAddTz && <div style={{ width:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", borderLeft:tzList.length>0?"0.5px solid var(--divider)":"none" }} onClick={onAddTz}><span style={{ fontSize:15, color:"var(--muted)" }}>+</span></div>}
        </div>
        {dates.map((d,i) => (
          <div key={i} onClick={() => onDayClick(d.year,d.month,d.day)}
            style={{ flex:1, padding:singleDay?"10px 20px":"8px 10px", textAlign:"center", borderRight:i<dates.length-1?"0.5px solid var(--divider)":"none", cursor:"pointer", background:isToday(d)?"color-mix(in oklab, var(--accent) 5%, transparent)":"transparent" }}>
            {!singleDay && <div style={{ fontSize:10, fontWeight:600, color:"var(--muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{DOW_LABELS[i]}</div>}
            {singleDay  && <div style={{ fontSize:10, fontWeight:600, color:"var(--muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{CAL_DAYS_FULL[new Date(d.year,d.month,d.day).getDay()]}</div>}
            <div style={{ fontSize:singleDay?22:16, fontWeight:isToday(d)?700:400, color:isToday(d)?"var(--accent)":"var(--text)", marginTop:2 }}>{d.day}</div>
          </div>
        ))}
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflow:"auto", display:"flex" }}>
        {/* TZ gutter */}
        <div style={{ width:leftW, flexShrink:0, display:"flex", borderRight:"0.5px solid var(--divider)" }}>
          {tzList.map((tz,ti) => (
            <div key={tz.id} style={{ width:TZ_W, borderRight:ti<tzList.length-1?"0.5px solid var(--divider)":"none" }}>
              {hours.map(h => (
                <div key={h} style={{ height:CELL_H, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:3, boxSizing:"border-box", borderBottom:"0.5px solid var(--divider)" }}>
                  <span style={{ fontSize:9, color:"var(--muted)" }}>{fmtH(tzAdjH(h,tz))}</span>
                </div>
              ))}
            </div>
          ))}
          {canAddTz && <div style={{ width:26, borderLeft:tzList.length>0?"0.5px solid var(--divider)":"none" }} />}
        </div>

        {/* Day columns */}
        {dates.map((d,i) => {
          const key = `${d.year}-${d.month}-${d.day}`;
          const evts = eventsByDate[key] || [];
          const colSel = sel?.colIdx === i ? sel : null;
          return (
            <div key={i} style={{ flex:1, position:"relative", borderRight:i<dates.length-1?"0.5px solid var(--divider)":"none", userSelect:"none" }}>
              {hours.map(h => (
                <div key={h} style={{ height:CELL_H, borderBottom:"0.5px solid var(--divider)", boxSizing:"border-box" }}
                  onMouseDown={e => { if (!e.target.closest("[data-event]")) handleDragStart(i, d, h); }}
                  onMouseEnter={() => handleDragExtend(i, h)} />
              ))}
              {/* Drag selection highlight */}
              {colSel && (
                <div style={{ position:"absolute", pointerEvents:"none", top:(Math.min(colSel.startH,colSel.endH-1)-HR_S)*CELL_H, height:Math.abs(colSel.endH-colSel.startH)*CELL_H, left:2, right:2, background:"color-mix(in oklab, var(--accent) 14%, transparent)", border:"1.5px solid var(--accent)", borderRadius:5, zIndex:5 }}>
                  <div style={{ padding:"3px 6px", fontSize:10.5, fontWeight:600, color:"var(--accent)" }}>{fmtH(colSel.startH)} – {fmtH(colSel.endH)}</div>
                </div>
              )}
              {evts.map(ev => {
                const top = (ev.sh - HR_S) * CELL_H;
                const height = Math.max(ev.dur * CELL_H - 2, 18);
                const wPct = 100 / ev.totalCols;
                const lPct = ev.ci * wPct;
                return (
                  <TimedEvent key={ev.id} ev={ev} onClick={() => onEventClick?.(ev)}
                    style={{ position:"absolute", top, height, left:`calc(${lPct}% + 2px)`, width:`calc(${wPct}% - 4px)` }} />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimedEvent({ ev, style, onClick }) {
  const base = { ...style, borderRadius:4, padding:"3px 6px", overflow:"hidden", cursor:"pointer", boxSizing:"border-box", zIndex:2 };
  const shared = { "data-event":"true", onClick };
  if (ev.type==="skipped") return (
    <div {...shared} style={{ ...base, background:"var(--surface)", border:"1.5px dashed var(--border)", color:"var(--muted)" }}>
      <div style={{ fontSize:10.5, fontWeight:500, textDecoration:"line-through", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
      {ev.dur>=1 && <div style={{ fontSize:9, marginTop:1 }}>Skipped</div>}
    </div>
  );
  if (ev.type==="double-booked") return (
    <div {...shared} style={{ ...base, background:`color-mix(in oklab,${ev.color} 18%,var(--surface))`, borderLeft:`3px solid ${ev.color}`, borderTop:"1.5px solid #e53e3e" }}>
      <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:1 }}>
        <span style={{ width:5,height:5,borderRadius:"50%",background:"#e53e3e",flexShrink:0 }} />
        <span style={{ fontSize:8.5, color:"#e53e3e", fontWeight:700 }}>CONFLICT</span>
      </div>
      <div style={{ fontSize:10.5, fontWeight:500, color:"var(--text)", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
    </div>
  );
  if (ev.type==="mirror") return (
    <div {...shared} style={{ ...base, background:`color-mix(in oklab,${ev.color} 8%,var(--surface))`, border:`1px solid color-mix(in oklab,${ev.color} 30%,transparent)`, opacity:0.72 }}>
      <div style={{ fontSize:10.5, fontWeight:400, color:"var(--dim)", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
      {ev.dur>=1 && <div style={{ fontSize:9, color:"var(--muted)", marginTop:1 }}>Mirror</div>}
    </div>
  );
  if (ev.isLocal) return (
    <div {...shared} style={{ ...base, background:`color-mix(in oklab,${ev.calColor||ev.color} 25%,var(--surface))`, borderLeft:`3px solid ${ev.calColor||ev.color}`, boxShadow:`0 0 0 1px ${ev.calColor||ev.color}40` }}>
      <div style={{ fontSize:10.5, fontWeight:600, color:"var(--text)", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
      {ev.dur>=1 && <div style={{ fontSize:9, color:"var(--dim)", marginTop:1 }}>{fmtH(ev.sh)} – {fmtH(ev.sh+ev.dur)}</div>}
    </div>
  );
  return (
    <div {...shared} style={{ ...base, background:`color-mix(in oklab,${ev.color} 18%,var(--surface))`, borderLeft:`3px solid ${ev.color}` }}>
      <div style={{ fontSize:10.5, fontWeight:500, color:"var(--text)", lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.title}</div>
      {ev.dur>=1 && <div style={{ fontSize:9, color:"var(--dim)", marginTop:1 }}>{fmtH(ev.sh)} – {fmtH(ev.sh+ev.dur)}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function ConnectModal({ open, onClose, onConnect }) {
  const [step, setStep] = useStateC(0);
  const [provider, setProvider] = useStateC(null);
  useEffectC(() => { if (open) { setStep(0); setProvider(null); } }, [open]);
  const handlePick = p => { setProvider(p); setStep(1); setTimeout(() => setStep(2), 1100); };
  const handleFinish = label => {
    const isGoogle = provider==="google";
    const id = "acc-"+Math.random().toString(36).slice(2,6);
    const calBase = id+"-c";
    onConnect({ id, provider, email:isGoogle?"new.account@gmail.com":"new.account@outlook.com", label, connectedAt:"today", status:"active",
      calendars:[
        { id:calBase+"1", name:isGoogle?"new.account@gmail.com":"new.account@outlook.com", color:"#5ba6f0", primary:true, visible:true, role:"owner" },
        { id:calBase+"2", name:"Birthdays", color:"#dc6c9b", primary:false, visible:false, role:"reader" },
      ],
    });
  };
  return (
    <Modal open={open} onClose={onClose} title="Connect a calendar" width={520}>
      {step===0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div className="dim" style={{ fontSize:13, marginBottom:4 }}>Choose a provider. We'll redirect you to authorize EinKal — read-only by default.</div>
          <ProviderRow icon={<Provider.Google size={20} />} name="Google Calendar" sub="Personal, Workspace, or School accounts" onClick={()=>handlePick("google")} />
          <ProviderRow icon={<Provider.Microsoft size={20} />} name="Microsoft Outlook" sub="Personal, Office 365, Exchange" onClick={()=>handlePick("microsoft")} />
          <div style={{ marginTop:10, padding:"10px 12px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, display:"flex", gap:9 }}>
            <I.Shield size={14} style={{ color:"var(--ok)", marginTop:1 }} />
            <div style={{ fontSize:12, lineHeight:1.5 }} className="t2">EinKal reads event metadata to mirror it. <a style={{ color:"var(--accent)", cursor:"default" }}>Privacy details</a></div>
          </div>
        </div>
      )}
      {step===1 && (
        <div style={{ padding:"40px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <div style={{ width:56, height:56, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--surface-hi)", border:"0.5px solid var(--border)" }}>
            {provider==="google" ? <Provider.Google size={28} /> : <Provider.Microsoft size={28} />}
          </div>
          <div style={{ fontSize:15, fontWeight:500 }}>Authorizing with {provider==="google"?"Google":"Microsoft"}…</div>
          <Spinner />
        </div>
      )}
      {step===2 && <ConnectFinish provider={provider} onCancel={onClose} onFinish={handleFinish} />}
    </Modal>
  );
}

function ProviderRow({ icon, name, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ width:"100%", padding:"12px 14px", display:"flex", alignItems:"center", gap:12, background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:9, textAlign:"left", transition:"background 0.12s, border-color 0.12s" }}
      onMouseEnter={e=>{e.currentTarget.style.background="var(--surface-hi)";e.currentTarget.style.borderColor="var(--border-hi)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="var(--surface)";e.currentTarget.style.borderColor="var(--border)";}}>
      {icon}
      <div style={{ flex:1 }}><div style={{ fontSize:13.5, fontWeight:500 }}>{name}</div><div className="dim" style={{ fontSize:11.5, marginTop:1 }}>{sub}</div></div>
      <I.ArrowRight size={14} style={{ color:"var(--dim)" }} />
    </button>
  );
}

function ConnectFinish({ provider, onFinish, onCancel }) {
  const [label, setLabel] = useStateC("Work");
  const [picked, setPicked] = useStateC({});
  const discovered = provider==="google"
    ? [{id:"d1",name:"new.account@gmail.com",primary:true},{id:"d2",name:"Birthdays"},{id:"d3",name:"Holidays in US"},{id:"d4",name:"Side project"}]
    : [{id:"d1",name:"new.account@outlook.com",primary:true},{id:"d2",name:"Birthdays"},{id:"d3",name:"Team — Marketing"}];
  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <label className="label">Label</label>
        <input className="input" value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Work, Personal" />
      </div>
      <label className="label">Which calendars should EinKal see?</label>
      <div style={{ background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
        {discovered.map((c,i) => {
          const on = picked[c.id]!==false;
          return (
            <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderTop:i===0?"none":"0.5px solid var(--divider)" }}>
              <button className={"toggle "+(on?"on":"")} onClick={()=>setPicked(p=>({...p,[c.id]:!on}))} />
              <span style={{ fontSize:13, fontWeight:450 }}>{c.name}</span>
              {c.primary && <span className="chip" style={{ height:18, fontSize:10 }}>Primary</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={()=>onFinish(label)}><I.Check size={13} /> Add account</button>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarsScreen });
