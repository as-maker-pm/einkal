// screens-booking.jsx — Calendly-style booking links

const { useState: useStateB, useMemo: useMemoB } = React;

const SEED_BOOKINGS = [
  { id:"bk1", name:"30-min intro call",  slug:"intro-30",        type:"personal", duration:30, color:"#5ba6f0", active:true,  desc:"Quick intro to see if we're a good fit.",                location:"meet", days:[1,2,3,4,5], startH:9,  endH:17, buffer:15 },
  { id:"bk2", name:"Team interview",     slug:"team-interview",  type:"team",     duration:60, color:"#a78bfa", active:true,  desc:"Engineering interview. Come prepared with examples.",    location:"zoom", days:[1,2,3,4,5], startH:10, endH:16, buffer:0  },
  { id:"bk3", name:"Sprint planning",    slug:"sprint-planning", type:"team",     duration:45, color:"#34d399", active:false, desc:"Bi-weekly sprint planning for the core team.",            location:"meet", days:[1,3],       startH:14, endH:17, buffer:0  },
];

const LOCATION_OPTIONS = [
  { id:"meet",     label:"Google Meet"  },
  { id:"zoom",     label:"Zoom"         },
  { id:"teams",    label:"Teams"        },
  { id:"phone",    label:"Phone call"   },
  { id:"inperson", label:"In person"    },
  { id:"custom",   label:"Custom link"  },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const DOW_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const BUFFER_OPTIONS = [0,5,10,15,30];

const BOOKING_COLORS = ["#5ba6f0","#a78bfa","#34d399","#f59e0b","#e879a0","#38bdf8","#fb923c","#a3e635"];

function BookingScreen() {
  const [bookings, setBookings] = useStateB(SEED_BOOKINGS);
  const [createOpen, setCreateOpen] = useStateB(false);
  const [editItem, setEditItem] = useStateB(null);

  const toggleActive = (id) => setBookings(bs => bs.map(b => b.id === id ? { ...b, active: !b.active } : b));
  const deleteBooking = (id) => setBookings(bs => bs.filter(b => b.id !== id));
  const saveBooking = (data) => {
    if (editItem) {
      setBookings(bs => bs.map(b => b.id === editItem.id ? { ...b, ...data } : b));
      setEditItem(null);
    } else {
      setBookings(bs => [...bs, { ...data, id: "bk-" + Math.random().toString(36).slice(2,6), active: true }]);
    }
    setCreateOpen(false);
  };

  const personal = bookings.filter(b => b.type === "personal");
  const team     = bookings.filter(b => b.type === "team");

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <PageHeader
        title="Booking links"
        actions={
          <button className="btn primary" onClick={() => { setEditItem(null); setCreateOpen(true); }}>
            <I.Plus size={13} /> New booking link
          </button>
        }
      />

      <div style={{ flex:1, overflow:"auto", padding:"28px 32px 40px" }}>
        {/* Stats strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, marginBottom:28, border:"0.5px solid var(--border)", borderRadius:12, background:"var(--panel)", overflow:"hidden" }}>
          <StatCell label="Total links"    value={bookings.length}                      hint={`${bookings.filter(b=>b.active).length} active`} />
          <StatCell label="Personal"       value={personal.length}                      hint="your links" />
          <StatCell label="Team"           value={team.length}                          hint="shared links" />
        </div>

        {/* Personal */}
        {personal.length > 0 && (
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>Personal</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:12 }}>
              {personal.map(b => <BookingCard key={b.id} booking={b} onToggle={toggleActive} onEdit={b => { setEditItem(b); setCreateOpen(true); }} onDelete={deleteBooking} />)}
            </div>
          </div>
        )}

        {/* Team */}
        {team.length > 0 && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>Team</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:12 }}>
              {team.map(b => <BookingCard key={b.id} booking={b} onToggle={toggleActive} onEdit={b => { setEditItem(b); setCreateOpen(true); }} onDelete={deleteBooking} />)}
            </div>
          </div>
        )}

        {bookings.length === 0 && (
          <Empty icon={<I.Link size={28} />} title="No booking links yet" sub="Create a link to let people book time with you — like Calendly, but built into EinKal." action={<button className="btn primary" onClick={() => setCreateOpen(true)}><I.Plus size={13} /> Create your first link</button>} />
        )}
      </div>

      {createOpen && (
        <CreateBookingModal
          initial={editItem}
          onClose={() => { setCreateOpen(false); setEditItem(null); }}
          onSave={saveBooking}
        />
      )}
    </div>
  );
}

function StatCell({ label, value, hint }) {
  return (
    <div style={{ padding:"18px 24px", borderRight:"0.5px solid var(--border)" }}>
      <div style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.02em", marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:12.5, fontWeight:500, marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:11, color:"var(--muted)" }}>{hint}</div>
    </div>
  );
}

function BookingCard({ booking: b, onToggle, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useStateB(false);
  const loc = LOCATION_OPTIONS.find(l => l.id === b.location);
  const activeDays = b.days.map(d => DOW_LABELS[d]).join(", ");
  const slug = `einkal.cc/u/${b.slug}`;

  return (
    <div className="card" style={{ padding:0, overflow:"hidden", opacity: b.active ? 1 : 0.6 }}>
      {/* Color bar */}
      <div style={{ height:4, background: b.active ? b.color : "var(--border)" }} />

      <div style={{ padding:"14px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
              <span style={{ fontSize:14.5, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.name}</span>
              <span style={{ padding:"2px 7px", borderRadius:999, fontSize:10, fontWeight:600, background: b.type==="team" ? "color-mix(in oklab, #a78bfa 15%, var(--surface))" : "color-mix(in oklab, #5ba6f0 15%, var(--surface))", color: b.type==="team" ? "#a78bfa" : "#5ba6f0" }}>
                {b.type === "team" ? "Team" : "Personal"}
              </span>
            </div>
            {b.desc && <p style={{ fontSize:12, color:"var(--dim)", margin:0, lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{b.desc}</p>}
          </div>
          <div style={{ position:"relative", flexShrink:0 }}>
            <button className="iconbtn" onClick={() => setMenuOpen(o=>!o)}><I.More size={14} /></button>
            {menuOpen && (
              <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", width:180, background:"var(--panel)", border:"0.5px solid var(--border-hi)", borderRadius:9, padding:"4px 0", boxShadow:"0 4px 20px rgba(0,0,0,0.2)", zIndex:50 }}
                onMouseLeave={() => setMenuOpen(false)}>
                <MenuItemB label="Edit link" icon={<I.Edit size={12} />} onClick={() => { onEdit(b); setMenuOpen(false); }} />
                <MenuItemB label="Copy link" icon={<I.Copy size={12} />} onClick={() => setMenuOpen(false)} />
                <MenuItemB label="Duplicate" icon={<I.Copy size={12} />} onClick={() => setMenuOpen(false)} />
                <div style={{ height:"0.5px", background:"var(--divider)", margin:"4px 0" }} />
                <MenuItemB label="Delete" icon={<I.Trash size={12} />} danger onClick={() => { onDelete(b.id); setMenuOpen(false); }} />
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          <MetaChip icon={<I.Clock size={11} />} label={`${b.duration} min`} />
          <MetaChip icon={<I.Globe size={11} />} label={loc?.label || b.location} />
          <MetaChip icon={<I.Calendar size={11} />} label={activeDays} />
          {b.buffer > 0 && <MetaChip icon={<I.Activity size={11} />} label={`${b.buffer}m buffer`} />}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:"10px 16px 12px", borderTop:"0.5px solid var(--divider)", display:"flex", alignItems:"center", gap:8, background:"var(--bg-1)" }}>
        <span style={{ fontSize:11, color:"var(--muted)", flex:1, fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{slug}</span>
        <button className="iconbtn sm" title="Copy link"><I.Copy size={12} /></button>
        <button className="iconbtn sm" title="Open preview"><I.ExtLink size={12} /></button>
        <button className={"toggle sm " + (b.active ? "on" : "")} onClick={() => onToggle(b.id)} style={{ width:32, height:18 }} />
      </div>
    </div>
  );
}

function MetaChip({ icon, label }) {
  return (
    <span style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"var(--surface)", borderRadius:999, fontSize:11, color:"var(--dim)" }}>
      {icon} {label}
    </span>
  );
}

function MenuItemB({ label, icon, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 12px", fontSize:12.5, color: danger ? "var(--danger)" : "var(--text-2)", background:"transparent", textAlign:"left" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ color: danger ? "var(--danger)" : "var(--dim)" }}>{icon}</span>
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Create / Edit booking link modal
// ─────────────────────────────────────────────────────────────────
function CreateBookingModal({ initial, onClose, onSave }) {
  const [name,     setName]     = useStateB(initial?.name     || "");
  const [slug,     setSlug]     = useStateB(initial?.slug     || "");
  const [type,     setType]     = useStateB(initial?.type     || "personal");
  const [duration, setDuration] = useStateB(initial?.duration || 30);
  const [color,    setColor]    = useStateB(initial?.color    || BOOKING_COLORS[0]);
  const [desc,     setDesc]     = useStateB(initial?.desc     || "");
  const [location, setLocation] = useStateB(initial?.location || "meet");
  const [days,     setDays]     = useStateB(initial?.days     || [1,2,3,4,5]);
  const [startH,   setStartH]   = useStateB(initial?.startH   || 9);
  const [endH,     setEndH]     = useStateB(initial?.endH     || 17);
  const [buffer,   setBuffer]   = useStateB(initial?.buffer   || 0);
  const [step,     setStep]     = useStateB(0);

  const toggleDay = (d) => setDays(ds => ds.includes(d) ? ds.filter(x=>x!==d) : [...ds, d].sort((a,b)=>a-b));

  const autoSlug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  const handleSave = () => {
    onSave({ name: name || "Untitled link", slug: slug || autoSlug(name) || "my-link", type, duration, color, desc, location, days, startH, endH, buffer });
  };

  const HOURS = Array.from({length:24}, (_,i) => ({ value:i, label: i === 0 ? "12 am" : i < 12 ? `${i} am` : i === 12 ? "12 pm" : `${i-12} pm` }));

  return (
    <Modal open onClose={onClose} title={initial ? "Edit booking link" : "New booking link"} width={560}>
      {/* Step tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:24, background:"var(--surface)", borderRadius:8, padding:3 }}>
        {["Basic info","Availability","Location & extras"].map((s,i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            flex:1, padding:"6px 8px", borderRadius:6, fontSize:12, fontWeight:500,
            background: step===i ? "var(--bg-1)" : "transparent",
            color: step===i ? "var(--text)" : "var(--muted)",
            boxShadow: step===i ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
            transition:"all 0.15s",
          }}>{s}</button>
        ))}
      </div>

      {/* Step 0: Basic info */}
      {step === 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label className="label">Link name</label>
            <input className="input" value={name} onChange={e => { setName(e.target.value); if (!initial) setSlug(autoSlug(e.target.value)); }} placeholder="e.g. 30-min intro call" />
          </div>
          <div>
            <label className="label">URL slug</label>
            <div style={{ display:"flex", alignItems:"center", gap:0, background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
              <span style={{ padding:"8px 10px", fontSize:12, color:"var(--muted)", borderRight:"0.5px solid var(--border)", background:"var(--surface-hi)", whiteSpace:"nowrap" }}>einkal.cc/u/</span>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-link"
                style={{ flex:1, padding:"8px 10px", background:"transparent", border:"none", outline:"none", fontSize:13, color:"var(--text)" }} />
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <Segmented value={type} onChange={setType} options={[{value:"personal",label:"Personal"},{value:"team",label:"Team"}]} />
            <div className="help">{type==="personal" ? "Only you can accept bookings." : "Any team member can accept — round-robin or first available."}</div>
          </div>
          <div>
            <label className="label">Duration</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {DURATION_OPTIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  padding:"6px 14px", borderRadius:20, fontSize:12.5,
                  background: duration===d ? "var(--accent)" : "var(--surface)",
                  color: duration===d ? "var(--ink-on-accent)" : "var(--text-2)",
                  border: `1.5px solid ${duration===d ? "var(--accent)" : "var(--border)"}`,
                  transition:"all 0.1s",
                }}>{d} min</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div style={{ display:"flex", gap:8 }}>
              {BOOKING_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width:26, height:26, borderRadius:"50%", background:c, border:`2.5px solid ${color===c ? "var(--text)" : "transparent"}`, transition:"border-color 0.1s" }} />
              ))}
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What should attendees know before booking?" rows={3} style={{ resize:"vertical" }} />
          </div>
        </div>
      )}

      {/* Step 1: Availability */}
      {step === 1 && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div>
            <label className="label">Available days</label>
            <div style={{ display:"flex", gap:6 }}>
              {DOW_LABELS.map((d,i) => (
                <button key={i} onClick={() => toggleDay(i)} style={{
                  width:38, height:38, borderRadius:8, fontSize:12, fontWeight:600,
                  background: days.includes(i) ? "var(--accent)" : "var(--surface)",
                  color: days.includes(i) ? "var(--ink-on-accent)" : "var(--muted)",
                  border: `1.5px solid ${days.includes(i) ? "var(--accent)" : "var(--border)"}`,
                  transition:"all 0.1s",
                }}>{d[0]}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Working hours</label>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <select value={startH} onChange={e => setStartH(parseInt(e.target.value))}
                style={{ flex:1, padding:"7px 10px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, fontSize:13, color:"var(--text)", outline:"none" }}>
                {HOURS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
              <span style={{ color:"var(--muted)", fontSize:13 }}>to</span>
              <select value={endH} onChange={e => setEndH(parseInt(e.target.value))}
                style={{ flex:1, padding:"7px 10px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:8, fontSize:13, color:"var(--text)", outline:"none" }}>
                {HOURS.filter(h => h.value > startH).map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Buffer between meetings</label>
            <div style={{ display:"flex", gap:6 }}>
              {BUFFER_OPTIONS.map(b => (
                <button key={b} onClick={() => setBuffer(b)} style={{
                  flex:1, padding:"6px 4px", borderRadius:8, fontSize:12,
                  background: buffer===b ? "var(--accent)" : "var(--surface)",
                  color: buffer===b ? "var(--ink-on-accent)" : "var(--text-2)",
                  border: `1.5px solid ${buffer===b ? "var(--accent)" : "var(--border)"}`,
                  transition:"all 0.1s",
                }}>{b===0 ? "None" : `${b}m`}</button>
              ))}
            </div>
            <div className="help">Extra time blocked after each booking so you can prepare for the next.</div>
          </div>
          {/* Visual preview */}
          <div style={{ padding:"14px 16px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:10 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Preview — weekly schedule</div>
            <div style={{ display:"flex", gap:4 }}>
              {DOW_LABELS.map((d,i) => {
                const active = days.includes(i);
                const totalH = endH - startH;
                return (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", gap:3, alignItems:"center" }}>
                    <span style={{ fontSize:9, fontWeight:600, color: active ? "var(--text)" : "var(--muted)" }}>{d[0]}</span>
                    <div style={{ width:"100%", height:60, borderRadius:4, background: active ? `color-mix(in oklab, ${color} 25%, var(--surface-hi))` : "var(--surface)", border: active ? `1px solid ${color}` : "1px solid var(--border)", position:"relative", overflow:"hidden" }}>
                      {active && <div style={{ position:"absolute", left:2, right:2, top:`${((startH/24)*100).toFixed(0)}%`, height:`${((totalH/24)*100).toFixed(0)}%`, background:color, borderRadius:2, opacity:0.7 }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Location & extras */}
      {step === 2 && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div>
            <label className="label">Conferencing / location</label>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {LOCATION_OPTIONS.map(l => (
                <button key={l.id} onClick={() => setLocation(l.id)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 14px",
                  background: location===l.id ? `color-mix(in oklab, ${color} 12%, var(--surface))` : "var(--surface)",
                  border: `1.5px solid ${location===l.id ? color : "var(--border)"}`,
                  borderRadius:9, textAlign:"left", transition:"all 0.1s",
                }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background: location===l.id ? color : "var(--muted)", flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:450 }}>{l.label}</span>
                  {location===l.id && <I.Check size={13} style={{ marginLeft:"auto", color }} />}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:"14px 16px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:10 }}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Booking page preview</div>
            <div style={{ height:4, background:color, borderRadius:2, marginBottom:12 }} />
            <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{name || "Your booking link"}</div>
            <div style={{ fontSize:12, color:"var(--dim)", marginBottom:10 }}>{desc || "No description yet."}</div>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ padding:"4px 10px", background:"var(--surface-hi)", borderRadius:20, fontSize:11 }}>{duration} min</span>
              <span style={{ padding:"4px 10px", background:"var(--surface-hi)", borderRadius:20, fontSize:11 }}>{LOCATION_OPTIONS.find(l=>l.id===location)?.label}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:"flex", gap:8, justifyContent:"space-between", marginTop:24 }}>
        <div style={{ display:"flex", gap:6 }}>
          {step > 0 && <button className="btn" onClick={() => setStep(s=>s-1)}>← Back</button>}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          {step < 2
            ? <button className="btn primary" onClick={() => setStep(s=>s+1)}>Next →</button>
            : <button className="btn primary" onClick={handleSave}><I.Check size={13} /> {initial ? "Save changes" : "Create link"}</button>
          }
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { BookingScreen });
