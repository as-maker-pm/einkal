// screens-sync.jsx — Sync flows list + builder (two layout variants)

const { useState: useStateS, useEffect: useEffectS, useMemo: useMemoS, useRef: useRefS } = React;

// ─────────────────────────────────────────────────────────────────
// Sync flows list
// ─────────────────────────────────────────────────────────────────
function SyncScreen({ openFlow, setOpenFlow, builderLayout }) {
  const { state, removeFlow, updateFlow, addFlow, pushActivity } = useStore();
  const toast = useToast();
  const [filter, setFilter] = useStateS("all");
  const [query, setQuery] = useStateS("");

  const filtered = useMemoS(() => {
    return state.flows.filter(f => {
      if (filter === "active" && f.paused) return false;
      if (filter === "paused" && !f.paused) return false;
      if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [state.flows, filter, query]);

  if (openFlow !== null) {
    return <FlowBuilder
      flowId={openFlow === "new" ? null : openFlow}
      layout={builderLayout}
      onClose={() => setOpenFlow(null)}
      onSave={(flow) => {
        if (openFlow === "new") {
          addFlow(flow);
          pushActivity(`Created flow "${flow.name}"`, "flow");
          toast("New flow created — running…", "ok");
        } else {
          updateFlow(openFlow, flow);
          pushActivity(`Updated flow "${flow.name}"`, "flow");
          toast("Flow updated", "ok");
        }
        setOpenFlow(null);
      }}
    />;
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Sync flows"
        subtitle="Each flow is a one-way or two-way rule: which calendars feed which, what details travel, what stays hidden."
        actions={
          <button className="btn primary" onClick={() => setOpenFlow("new")}>
            <I.Plus size={13} /> New flow
          </button>
        }
      />

      {/* sub-toolbar */}
      <div style={{ padding: "14px 32px", display: "flex", alignItems: "center", gap: 12, borderBottom: "0.5px solid var(--divider)" }}>
        <Segmented value={filter} onChange={setFilter} size="sm"
          options={[
            { value: "all", label: `All ${state.flows.length}` },
            { value: "active", label: `Active ${state.flows.filter(f => !f.paused).length}` },
            { value: "paused", label: `Paused ${state.flows.filter(f => f.paused).length}` },
          ]} />
        <div style={{ flex: 1 }} />
        <div style={{ position: "relative", width: 240 }}>
          <I.Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input className="input" placeholder="Search flows" style={{ height: 28, paddingLeft: 30, fontSize: 12.5 }} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 32px 40px" }}>
        {filtered.length === 0 ? (
          <Empty
            icon={<I.Sync size={32} />}
            title={query ? "No flows match" : "No flows yet"}
            body={query ? "Try a different search." : "Wire up your first sync — pick a source, pick a destination, choose how loud or quiet it should be."}
            action={!query && <button className="btn primary" onClick={() => setOpenFlow("new")}><I.Plus size={13} /> Create a flow</button>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(f => (
              <FlowCard key={f.id} flow={f}
                onOpen={() => setOpenFlow(f.id)}
                onTogglePause={() => { updateFlow(f.id, { paused: !f.paused }); toast(f.paused ? "Flow resumed" : "Flow paused", "info"); }}
                onDelete={() => { if (confirm(`Delete flow "${f.name}"? Mirror events on destinations will be cleaned up.`)) { removeFlow(f.id); toast("Flow deleted", "info"); } }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowCard({ flow, onOpen, onTogglePause, onDelete }) {
  const { state } = useStore();
  const srcs = flow.sources.map(id => findCalendar(state.accounts, id)).filter(Boolean);
  const dsts = flow.destinations.map(id => findCalendar(state.accounts, id)).filter(Boolean);
  const privacy = PRIVACY_PRESETS.find(p => p.id === flow.privacy);

  // plain-language summary
  const summary = (() => {
    const parts = [];
    if (flow.privacy === "busy") parts.push("shown as Busy");
    else if (flow.privacy === "title") parts.push("titles only");
    else if (flow.privacy === "titletime") parts.push("titles & times");
    else if (flow.privacy === "full") parts.push("full details");
    else if (flow.privacy === "template") parts.push(`shown as "${flow.template}"`);
    if (flow.stripAttendees) parts.push("no attendees");
    if (flow.workingHoursOnly) parts.push("9–6 only");
    if (flow.hideWeekends) parts.push("weekdays only");
    return parts.join(" · ");
  })();

  return (
    <button onClick={onOpen} className="card" style={{
      padding: 0, textAlign: "left", display: "block", overflow: "hidden",
      transition: "border-color 0.12s, background 0.12s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hi)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}>

      {/* Title row */}
      <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--divider)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 500, color: "var(--text)" }}>{flow.name}</div>
          <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>
            Last run <span style={{ color: "var(--text-2)" }}>{flow.lastRun}</span> · <span style={{ color: "var(--text-2)" }} className="tabnum">{flow.eventsSynced.toLocaleString()}</span> events
          </div>
        </div>
        {flow.paused
          ? <span className="dim" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--muted)" }} /> Paused
            </span>
          : <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-2)" }}>
              <span className="pulse" /> Running
            </span>}
        <div style={{ width: 0.5, height: 16, background: "var(--divider)", margin: "0 4px" }} />
        <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onTogglePause(); }} data-tip={flow.paused ? "Resume" : "Pause"}>
          {flow.paused ? <I.Play size={13} /> : <I.Pause size={13} />}
        </button>
        <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onDelete(); }} data-tip="Delete"><I.Trash size={13} /></button>
        <I.Chevron size={13} style={{ color: "var(--muted)" }} />
      </div>

      {/* From → To */}
      <div style={{
        padding: "10px 18px 14px",
        display: "grid", gridTemplateColumns: "1fr 20px 1fr", gap: 2, alignItems: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="dim" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>From</div>
          {srcs.slice(0, 3).map(c => (
            <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
            </span>
          ))}
          {srcs.length > 3 && <span className="dim" style={{ fontSize: 11 }}>+{srcs.length - 3} more</span>}
        </div>
        <div style={{ display: "flex", justifyContent: "center", color: "var(--dim)" }}>
          {flow.direction === "two-way" ? <I.ArrowsLR size={18} /> : <I.ArrowRight size={18} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="dim" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>To</div>
          {dsts.slice(0, 3).map(c => (
            <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
            </span>
          ))}
          {dsts.length > 3 && <span className="dim" style={{ fontSize: 11 }}>+{dsts.length - 3} more</span>}
        </div>
      </div>

      {/* Plain-language footer */}
      <div style={{
        padding: "10px 18px",
        borderTop: "0.5px solid var(--divider)",
        background: "var(--bg-1)",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "var(--text-2)",
      }}>
        <I.Lock size={11} style={{ color: "var(--dim)" }} />
        <span>{summary}</span>
      </div>
    </button>
  );
}

function FlowSide({ label, cals }) {
  if (!cals.length) return <div className="dim" style={{ fontSize: 12 }}>—</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <div className="dim" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>
        {label} <span style={{ marginLeft: 4, color: "var(--muted)", fontWeight: 500 }}>{cals.length}</span>
      </div>
      {cals.slice(0, 3).map(c => {
        const Mark = c.account.provider === "google" ? Provider.Google : Provider.Microsoft;
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 450, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
            <Mark size={10} />
            <span className="dim" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.account.email}</span>
          </div>
        );
      })}
      {cals.length > 3 && <span className="dim" style={{ fontSize: 11 }}>+{cals.length - 3} more</span>}
    </div>
  );
}

function CalendarStack({ cals, align = "right" }) {
  if (!cals.length) return <span className="dim" style={{ fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      {cals.slice(0, 3).map(c => <CalChip key={c.id} cal={c} align={align} />)}
      {cals.length > 3 && <span className="dim" style={{ fontSize: 11 }}>+{cals.length - 3} more</span>}
    </div>
  );
}

function CalChip({ cal, align = "right" }) {
  const Mark = cal.account.provider === "google" ? Provider.Google : Provider.Microsoft;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: "5px 9px", borderRadius: 6,
      background: "var(--surface)", border: "0.5px solid var(--border)",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: cal.color }} />
      <span style={{ fontSize: 12, fontWeight: 450 }}>{cal.name.length > 32 ? cal.name.slice(0, 30) + "…" : cal.name}</span>
      <span style={{ marginLeft: 4 }}><Mark size={11} /></span>
    </div>
  );
}

function DirectionArrow({ direction }) {
  return (
    <div style={{
      width: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      color: "var(--accent)",
    }}>
      {direction === "two-way" ? <I.ArrowsLR size={18} /> : <I.ArrowRight size={18} />}
      <span style={{ fontSize: 9.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
        {direction === "two-way" ? "Two-way" : "One-way"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Flow builder — dispatches between layouts
// ─────────────────────────────────────────────────────────────────
function FlowBuilder({ flowId, layout, onClose, onSave }) {
  const { state } = useStore();
  const existing = flowId ? state.flows.find(f => f.id === flowId) : null;
  const [draft, setDraft] = useStateS(existing || {
    name: "Untitled flow",
    sources: [],
    destinations: [],
    direction: "one-way",
    privacy: "busy",
    template: "Busy",
    stripAttendees: true,
    workingHoursOnly: false,
    hideWeekends: false,
    declined: "skip",
    paused: false,
    lastRun: "never",
    eventsSynced: 0,
  });
  const patch = (p) => setDraft(d => ({ ...d, ...p }));

  // Auto: if two-way, sources must match destinations conceptually
  const canSave = draft.name.trim().length > 0 && draft.sources.length > 0 && draft.destinations.length > 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header bar */}
      <div style={{
        padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: "0.5px solid var(--divider)", background: "var(--bg)",
      }}>
        <button className="btn ghost sm" onClick={onClose}><I.ArrowLeft size={13} /> Back</button>
        <div className="dim" style={{ fontSize: 12 }}>/</div>
        <input value={draft.name} onChange={(e) => patch({ name: e.target.value })}
          style={{
            background: "transparent", border: 0, outline: 0, color: "var(--text)",
            fontSize: 15, fontWeight: 500, padding: "4px 8px", borderRadius: 5,
            minWidth: 240,
          }}
          onFocus={(e) => e.currentTarget.style.background = "var(--surface)"}
          onBlur={(e) => e.currentTarget.style.background = "transparent"}
          placeholder="Flow name" />
        <div style={{ flex: 1 }} />
        <span className="chip" style={{ fontSize: 11 }}>
          {layout === "canvas" ? "Canvas layout" : "Linear layout"}
        </span>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => onSave(draft)} disabled={!canSave}>
          <I.Check size={13} /> Save flow
        </button>
      </div>

      {layout === "canvas"
        ? <CanvasBuilder draft={draft} patch={patch} />
        : <LinearBuilder draft={draft} patch={patch} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LINEAR layout — vertical, step-by-step
// ─────────────────────────────────────────────────────────────────
function LinearBuilder({ draft, patch }) {
  const [filtersOpen, setFiltersOpen] = useStateS(
    draft.stripAttendees || draft.workingHoursOnly || draft.hideWeekends || draft.declined !== "skip"
  );

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 60px", background: "var(--bg-1)" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* From → To — the heart of the flow, all in one visual */}
        <div className="card" style={{ padding: "22px 24px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 60px 1fr",
            gap: 16, alignItems: "stretch",
          }}>
            <PickerColumn
              label="From"
              hint="Source"
              selected={draft.sources}
              onChange={(ids) => patch({ sources: ids })}
              placeholder="Pick a calendar"
            />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <button
                onClick={() => patch({ direction: draft.direction === "two-way" ? "one-way" : "two-way" })}
                title={draft.direction === "two-way" ? "Two-way · click to switch" : "One-way · click to switch"}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {draft.direction === "two-way" ? <I.ArrowsLR size={18} /> : <I.ArrowRight size={18} />}
              </button>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>
                {draft.direction === "two-way" ? "Two-way" : "One-way"}
              </span>
            </div>
            <PickerColumn
              label="To"
              hint="Destination"
              selected={draft.destinations}
              onChange={(ids) => patch({ destinations: ids })}
              placeholder="Pick a calendar"
              excludeIds={draft.sources}
              align="right"
            />
          </div>
        </div>

        {/* Privacy — horizontal pill row */}
        <div className="card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>What travels?</div>
              <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>How much of each event the destination sees.</div>
            </div>
          </div>
          <PrivacyPills value={draft.privacy} onChange={(v) => patch({ privacy: v })} />
          {draft.privacy === "template" && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span className="dim" style={{ fontSize: 12, whiteSpace: "nowrap" }}>Title becomes</span>
              <input className="input" style={{ height: 30, fontSize: 12.5 }} value={draft.template} onChange={(e) => patch({ template: e.target.value })} placeholder="Busy — Work" />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <PrivacyPreview privacy={draft.privacy} template={draft.template} />
          </div>
        </div>

        {/* Filters — collapsed by default, expand when needed */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <button onClick={() => setFiltersOpen(o => !o)} style={{
            width: "100%", padding: "14px 22px",
            display: "flex", alignItems: "center", gap: 10,
            textAlign: "left",
            transition: "background 0.12s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <I.Chevron size={12} style={{ transform: filtersOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s", color: "var(--dim)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Filters &amp; cleanup <span className="dim" style={{ fontWeight: 400, fontSize: 12 }}>(optional)</span></div>
              <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>
                {[
                  draft.stripAttendees && "strip attendees",
                  draft.workingHoursOnly && "work hours only",
                  draft.hideWeekends && "skip weekends",
                  draft.declined !== "skip" && "include declined",
                ].filter(Boolean).join(" · ") || "Sync everything"}
              </div>
            </div>
          </button>
          {filtersOpen && (
            <div style={{ padding: "4px 22px 16px", borderTop: "0.5px solid var(--divider)" }}>
              <FilterRow label="Strip attendees" desc="Don't include the guest list on mirrored events."
                value={draft.stripAttendees} onChange={(v) => patch({ stripAttendees: v })} />
              <FilterRow label="Working hours only" desc="Only mirror events between 9 AM and 6 PM your time."
                value={draft.workingHoursOnly} onChange={(v) => patch({ workingHoursOnly: v })} />
              <FilterRow label="Skip weekends" desc="Saturdays and Sundays stay private."
                value={draft.hideWeekends} onChange={(v) => patch({ hideWeekends: v })} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0 4px", borderTop: "0.5px solid var(--divider)", marginTop: 4 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 450 }}>Declined invitations</span>
                <Segmented value={draft.declined} onChange={(v) => patch({ declined: v })} size="sm"
                  options={[{ value: "skip", label: "Skip" }, { value: "include", label: "Include" }]} />
              </div>
            </div>
          )}
        </div>

        <SummaryCard draft={draft} />
      </div>
    </div>
  );
}

function PickerColumn({ label, hint, selected, onChange, placeholder, excludeIds = [], align = "left" }) {
  const { state } = useStore();
  const [open, setOpen] = useStateS(false);
  const ref = useRefS(null);
  useEffectS(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const selectedCals = selected.map(id => findCalendar(state.accounts, id)).filter(Boolean);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "var(--muted)", textAlign: align,
      }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 76 }}>
        {selectedCals.map(c => {
          const Mark = c.account.provider === "google" ? Provider.Google : Provider.Microsoft;
          return (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 8,
              background: "color-mix(in oklab, " + c.color + " 14%, var(--surface))",
              borderLeft: `2px solid ${c.color}`,
              border: "0.5px solid var(--border)",
              borderLeftWidth: 2,
            }}>
              <Mark size={12} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div className="dim" style={{ fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.account.email}</div>
              </div>
              <button className="iconbtn" style={{ width: 20, height: 20 }} onClick={() => onChange(selected.filter(id => id !== c.id))}>
                <I.X size={11} />
              </button>
            </div>
          );
        })}
        <div style={{ position: "relative" }}>
          <button onClick={() => setOpen(o => !o)} style={{
            width: "100%", padding: "10px 12px",
            background: "transparent", border: "1px dashed var(--border-hi)",
            borderRadius: 8, fontSize: 12.5, color: selectedCals.length === 0 ? "var(--text-2)" : "var(--dim)",
            display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
            transition: "background 0.12s, color 0.12s, border-color 0.12s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-bg)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = selectedCals.length === 0 ? "var(--text-2)" : "var(--dim)"; e.currentTarget.style.borderColor = "var(--border-hi)"; }}>
            <I.Plus size={12} /> {selectedCals.length === 0 ? placeholder : "Add another"}
          </button>
          {open && (
            <CalendarMenu
              onPick={(id) => { onChange([...selected, id]); setOpen(false); }}
              exclude={[...selected, ...excludeIds]} />
          )}
        </div>
      </div>
      {hint && (
        <div className="dim" style={{ fontSize: 11, textAlign: align, marginTop: 2 }}>
          {selectedCals.length === 0 ? hint : `${selectedCals.length} calendar${selectedCals.length === 1 ? "" : "s"}`}
        </div>
      )}
    </div>
  );
}

function PrivacyPills({ value, onChange }) {
  const items = PRIVACY_PRESETS;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map(p => {
        const active = value === p.id;
        return (
          <button key={p.id} onClick={() => onChange(p.id)}
            title={p.body}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 14px", borderRadius: 999,
              fontSize: 12.5, fontWeight: 500,
              background: active ? "var(--accent)" : "var(--surface)",
              color: active ? "var(--ink-on-accent)" : "var(--text-2)",
              border: active ? "1px solid var(--accent)" : "0.5px solid var(--border)",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--hover)"; e.currentTarget.style.color = "var(--text)"; } }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--text-2)"; } }}>
            {p.icon === "lock" && <I.Lock size={11} />}
            {p.icon === "tag" && <I.Tag size={11} />}
            {p.icon === "clock" && <I.Clock size={11} />}
            {p.icon === "eye" && <I.Eye size={11} />}
            {p.icon === "edit" && <I.Edit size={11} />}
            {p.title}
          </button>
        );
      })}
    </div>
  );
}

function BuilderSection({ number, title, subtitle, children }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: "0.5px solid var(--divider)" }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "var(--surface-hi)", border: "0.5px solid var(--border)",
          fontSize: 11, fontWeight: 600, color: "var(--text-2)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          marginTop: 1,
        }}>{number}</div>
        <div style={{ flex: 1, paddingBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
          <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: "14px 20px 18px" }}>{children}</div>
    </div>
  );
}

function CalendarPicker({ selected, onChange, placeholder, excludeIds = [] }) {
  const { state } = useStore();
  const [open, setOpen] = useStateS(false);
  const ref = useRefS(null);
  useEffectS(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedCals = selected.map(id => findCalendar(state.accounts, id)).filter(Boolean);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selectedCals.map(c => {
          const Mark = c.account.provider === "google" ? Provider.Google : Provider.Microsoft;
          return (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 6px 5px 9px", borderRadius: 7,
              background: "var(--surface)", border: "0.5px solid var(--border)",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
              <span style={{ fontSize: 12.5, fontWeight: 450 }}>{c.name}</span>
              <Mark size={11} />
              <span className="dim" style={{ fontSize: 11 }}>· {c.account.label}</span>
              <button className="iconbtn" style={{ width: 18, height: 18 }} onClick={() => onChange(selected.filter(id => id !== c.id))}>
                <I.X size={10} />
              </button>
            </div>
          );
        })}
        <div ref={ref} style={{ position: "relative" }}>
          <button className="btn sm" onClick={() => setOpen(o => !o)}>
            <I.Plus size={12} /> {selectedCals.length === 0 ? placeholder : "Add another"}
          </button>
          {open && (
            <CalendarMenu
              onPick={(id) => { onChange([...selected, id]); setOpen(false); }}
              exclude={[...selected, ...excludeIds]} />
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarMenu({ onPick, exclude }) {
  const { state } = useStore();
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", left: 0,
      width: 320, maxHeight: 360, overflow: "auto",
      background: "var(--panel)", border: "0.5px solid var(--border-hi)",
      borderRadius: 9, boxShadow: "var(--shadow-pop)", zIndex: 20,
      padding: 6,
    }}>
      {state.accounts.map(acc => {
        const Mark = acc.provider === "google" ? Provider.Google : Provider.Microsoft;
        return (
          <div key={acc.id}>
            <div style={{ padding: "8px 8px 4px", display: "flex", alignItems: "center", gap: 7 }}>
              <Mark size={11} />
              <span className="dim" style={{ fontSize: 11, fontWeight: 500 }}>{acc.email}</span>
            </div>
            {acc.calendars.map(c => {
              const disabled = exclude.includes(c.id);
              return (
                <button key={c.id} disabled={disabled} onClick={() => onPick(c.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9,
                    padding: "7px 10px", borderRadius: 6,
                    fontSize: 12.5, opacity: disabled ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "var(--hover)"; }}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                  <span style={{ flex: 1, textAlign: "left" }}>{c.name}</span>
                  {disabled && <span className="dim" style={{ fontSize: 10 }}>added</span>}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PrivacyPicker({ value, onChange, template, onTemplate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
        {PRIVACY_PRESETS.map(p => (
          <button key={p.id} onClick={() => onChange(p.id)}
            style={{
              padding: "12px 12px", textAlign: "left",
              background: value === p.id ? "var(--accent-bg)" : "var(--surface)",
              border: value === p.id ? "1px solid var(--accent)" : "0.5px solid var(--border)",
              borderRadius: 9, display: "flex", flexDirection: "column", gap: 4,
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ color: value === p.id ? "var(--accent)" : "var(--dim)" }}>
                {p.icon === "lock" && <I.Lock size={13} />}
                {p.icon === "tag" && <I.Tag size={13} />}
                {p.icon === "clock" && <I.Clock size={13} />}
                {p.icon === "eye" && <I.Eye size={13} />}
                {p.icon === "edit" && <I.Edit size={13} />}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</span>
            </div>
            <span className="dim" style={{ fontSize: 11.5, lineHeight: 1.45 }}>{p.body}</span>
          </button>
        ))}
      </div>
      {value === "template" && (
        <div style={{ marginTop: 4, padding: "12px 14px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 8 }}>
          <label className="label">Title template</label>
          <input className="input" value={template} onChange={(e) => onTemplate(e.target.value)} placeholder="Busy — Work" />
          <div className="help">Available: <code className="mono">{"{title}"}</code> · <code className="mono">{"{calendar}"}</code> · <code className="mono">{"{source}"}</code></div>
        </div>
      )}
      <PrivacyPreview privacy={value} template={template} />
    </div>
  );
}

function PrivacyPreview({ privacy, template }) {
  // Show before/after of a real event
  const sample = { title: "Customer call — Northwind Q4 review", desc: "Discuss renewal terms, pricing.", attendees: ["alex@levitatedata.com", "kira@northwind.co", "+2"], location: "Zoom" };
  let after;
  if (privacy === "busy") after = { title: "Busy", desc: null, attendees: null, location: null };
  else if (privacy === "title") after = { title: sample.title, desc: null, attendees: null, location: null };
  else if (privacy === "titletime") after = { title: sample.title, desc: null, attendees: null, location: null };
  else if (privacy === "full") after = sample;
  else after = { title: template || "Busy", desc: null, attendees: null, location: null };

  return (
    <div style={{
      marginTop: 4, padding: 12, background: "var(--bg-1)",
      border: "0.5px dashed var(--border-hi)", borderRadius: 8,
      display: "grid", gridTemplateColumns: "1fr 28px 1fr", gap: 12, alignItems: "center",
    }}>
      <SamplePreview label="On source" data={sample} accent="#4f78e8" />
      <div style={{ display: "flex", justifyContent: "center", color: "var(--accent)" }}>
        <I.ArrowRight size={16} />
      </div>
      <SamplePreview label="On destination" data={after} accent="#a45fc6" muted />
    </div>
  );
}

function SamplePreview({ label, data, accent, muted }) {
  return (
    <div>
      <div className="dim" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{
        padding: "8px 10px", borderRadius: 6,
        background: "color-mix(in oklab, " + accent + " 12%, var(--panel))",
        borderLeft: `2px solid ${accent}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: muted && data.title.toLowerCase().includes("busy") ? "var(--text-2)" : "var(--text)" }}>{data.title}</div>
        {data.desc && <div className="dim" style={{ fontSize: 11, marginTop: 3 }}>{data.desc}</div>}
        {data.attendees && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
            <I.User size={10} style={{ color: "var(--dim)" }} />
            <span className="dim" style={{ fontSize: 10.5 }}>{data.attendees.join(", ")}</span>
          </div>
        )}
        {data.location && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
            <I.Globe size={10} style={{ color: "var(--dim)" }} />
            <span className="dim" style={{ fontSize: 10.5 }}>{data.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 450 }}>{label}</div>
        <div className="dim" style={{ fontSize: 11.5, marginTop: 1 }}>{desc}</div>
      </div>
      <button className={"toggle " + (value ? "on" : "")} onClick={() => onChange(!value)} />
    </div>
  );
}

function SummaryCard({ draft }) {
  const { state } = useStore();
  const srcs = draft.sources.map(id => findCalendar(state.accounts, id)).filter(Boolean);
  const dsts = draft.destinations.map(id => findCalendar(state.accounts, id)).filter(Boolean);
  const privacy = PRIVACY_PRESETS.find(p => p.id === draft.privacy);

  if (srcs.length === 0 || dsts.length === 0) {
    return (
      <div style={{
        padding: "14px 18px", background: "color-mix(in oklab, var(--accent) 6%, var(--panel))",
        border: "0.5px dashed color-mix(in oklab, var(--accent) 40%, var(--border))", borderRadius: 10,
        display: "flex", alignItems: "center", gap: 10, color: "var(--text-2)", fontSize: 13,
      }}>
        <I.Sparkles size={14} style={{ color: "var(--accent)" }} />
        Pick at least one source and one destination to start syncing.
      </div>
    );
  }

  return (
    <div style={{
      padding: "16px 20px", background: "var(--panel)",
      border: "1px solid var(--accent)", boxShadow: "0 0 0 4px var(--accent-bg)",
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <I.Check size={13} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ready to sync</span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.65 }}>
        Events from <strong>{srcs.map(c => c.name).join(", ")}</strong>{" "}
        will appear on <strong>{dsts.map(c => c.name).join(", ")}</strong>{" "}
        as <strong style={{ color: "var(--accent)" }}>{privacy?.title.toLowerCase()}</strong>
        {draft.direction === "two-way" && " — and back the other way"}
        {draft.stripAttendees && ", with attendees removed"}
        {draft.workingHoursOnly && ", working hours only"}
        {draft.hideWeekends && ", weekends skipped"}.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CANVAS layout — node graph
// ─────────────────────────────────────────────────────────────────
function CanvasBuilder({ draft, patch }) {
  const { state } = useStore();
  const srcs = draft.sources.map(id => findCalendar(state.accounts, id)).filter(Boolean);
  const dsts = draft.destinations.map(id => findCalendar(state.accounts, id)).filter(Boolean);

  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", overflow: "hidden", background: "var(--bg-1)" }}>
      {/* canvas */}
      <div style={{
        position: "relative", overflow: "auto",
        backgroundImage: "radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)",
        backgroundSize: "20px 20px",
      }}>
        <div style={{ minHeight: "100%", minWidth: 880, padding: "40px 32px", position: "relative" }}>
          <CanvasGraph srcs={srcs} dsts={dsts} draft={draft} patch={patch} />
        </div>
      </div>

      {/* inspector */}
      <div style={{
        borderLeft: "0.5px solid var(--divider)",
        background: "var(--bg)",
        overflow: "auto",
        padding: "20px 20px 40px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <InspectorBlock title="Direction">
          <Segmented value={draft.direction} onChange={(v) => patch({ direction: v })}
            options={[
              { value: "one-way", label: "One-way", icon: <I.ArrowRight size={11} /> },
              { value: "two-way", label: "Two-way", icon: <I.ArrowsLR size={11} /> },
            ]} />
        </InspectorBlock>

        <InspectorBlock title="Privacy">
          <select className="input select" value={draft.privacy} onChange={(e) => patch({ privacy: e.target.value })}>
            {PRIVACY_PRESETS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          {draft.privacy === "template" && (
            <input className="input" style={{ marginTop: 6 }} value={draft.template} onChange={(e) => patch({ template: e.target.value })} placeholder="Busy — Work" />
          )}
          <div className="help" style={{ marginTop: 6 }}>
            {PRIVACY_PRESETS.find(p => p.id === draft.privacy)?.body}
          </div>
        </InspectorBlock>

        <InspectorBlock title="Filters">
          <FilterRow label="Strip attendees" desc="" value={draft.stripAttendees} onChange={(v) => patch({ stripAttendees: v })} />
          <FilterRow label="Working hours only" desc="" value={draft.workingHoursOnly} onChange={(v) => patch({ workingHoursOnly: v })} />
          <FilterRow label="Skip weekends" desc="" value={draft.hideWeekends} onChange={(v) => patch({ hideWeekends: v })} />
        </InspectorBlock>

        <InspectorBlock title="When declined">
          <Segmented value={draft.declined} onChange={(v) => patch({ declined: v })} size="sm"
            options={[{ value: "skip", label: "Skip" }, { value: "include", label: "Include" }]} />
        </InspectorBlock>
      </div>
    </div>
  );
}

function InspectorBlock({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}

function CanvasGraph({ srcs, dsts, draft, patch }) {
  const wrapRef = useRefS(null);
  const [size, setSize] = useStateS({ w: 800, h: 480 });
  useEffectS(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: Math.max(e.contentRect.height, 400) }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // layout: sources on left, hub in middle, dests on right
  const leftX = 60;
  const rightX = size.w - 280;
  const hubX = (leftX + 240 + rightX) / 2;
  const hubY = size.h / 2;

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", minHeight: 480 }}>
      {/* connector svg */}
      <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="100%" height={size.h}>
        <defs>
          <linearGradient id="conn" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2ECC71" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#2ECC71" stopOpacity="0.9" />
            <stop offset="1" stopColor="#2ECC71" stopOpacity="0.2" />
          </linearGradient>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2ECC71" />
          </marker>
        </defs>
        {srcs.map((s, i) => {
          const y = 60 + i * 70 + 30;
          const startX = leftX + 240;
          return (
            <path key={s.id} d={`M ${startX} ${y} C ${startX + 60} ${y}, ${hubX - 60} ${hubY}, ${hubX} ${hubY}`}
              stroke="url(#conn)" strokeWidth="1.5" fill="none" markerEnd={draft.direction === "two-way" ? "" : "url(#arr)"} />
          );
        })}
        {dsts.map((d, i) => {
          const y = 60 + i * 70 + 30;
          const endX = rightX;
          return (
            <path key={d.id} d={`M ${hubX} ${hubY} C ${hubX + 60} ${hubY}, ${endX - 60} ${y}, ${endX} ${y}`}
              stroke="url(#conn)" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
          );
        })}
      </svg>

      {/* column labels */}
      <div style={{ position: "absolute", left: leftX, top: 16, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)" }}>
        Sources
      </div>
      <div style={{ position: "absolute", left: rightX, top: 16, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)" }}>
        Destinations
      </div>

      {/* source nodes */}
      {srcs.map((c, i) => (
        <CalNode key={c.id} cal={c} x={leftX} y={60 + i * 70} onRemove={() => patch({ sources: draft.sources.filter(id => id !== c.id) })} />
      ))}
      <AddNode x={leftX} y={60 + srcs.length * 70} excludeIds={draft.destinations} existingIds={draft.sources}
        onPick={(id) => patch({ sources: [...draft.sources, id] })} label="Add source" />

      {/* hub */}
      <HubNode x={hubX - 70} y={hubY - 38} draft={draft} />

      {/* destination nodes */}
      {dsts.map((c, i) => (
        <CalNode key={c.id} cal={c} x={rightX} y={60 + i * 70} onRemove={() => patch({ destinations: draft.destinations.filter(id => id !== c.id) })} />
      ))}
      <AddNode x={rightX} y={60 + dsts.length * 70} excludeIds={draft.sources} existingIds={draft.destinations}
        onPick={(id) => patch({ destinations: [...draft.destinations, id] })} label="Add destination" />
    </div>
  );
}

function CalNode({ cal, x, y, onRemove }) {
  const Mark = cal.account.provider === "google" ? Provider.Google : Provider.Microsoft;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: 240, padding: "10px 12px",
      background: "var(--panel)", border: "0.5px solid var(--border-hi)",
      borderRadius: 10, boxShadow: "var(--shadow-pop)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: cal.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cal.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
          <Mark size={9} />
          <span className="dim" style={{ fontSize: 10.5 }}>{cal.account.label}</span>
        </div>
      </div>
      <button className="iconbtn" style={{ width: 22, height: 22 }} onClick={onRemove}><I.X size={11} /></button>
    </div>
  );
}

function AddNode({ x, y, onPick, excludeIds, existingIds, label }) {
  const [open, setOpen] = useStateS(false);
  const ref = useRefS(null);
  useEffectS(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: "absolute", left: x, top: y, width: 240 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "10px 12px",
        background: "transparent", border: "1px dashed var(--border-hi)",
        borderRadius: 10, fontSize: 12.5, color: "var(--dim)",
        display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
        transition: "background 0.12s, color 0.12s, border-color 0.12s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--dim)"; e.currentTarget.style.borderColor = "var(--border-hi)"; }}>
        <I.Plus size={12} /> {label}
      </button>
      {open && <CalendarMenu exclude={[...existingIds, ...excludeIds]} onPick={(id) => { onPick(id); setOpen(false); }} />}
    </div>
  );
}

function HubNode({ x, y, draft }) {
  const privacy = PRIVACY_PRESETS.find(p => p.id === draft.privacy);
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: 140, padding: "12px",
      background: "color-mix(in oklab, var(--accent) 14%, var(--panel))",
      border: "1px solid var(--accent)",
      borderRadius: 12,
      boxShadow: "0 0 0 6px var(--accent-bg), var(--shadow-pop)",
      textAlign: "center",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: "var(--accent)" }}>
        {draft.direction === "two-way" ? <I.ArrowsLR size={18} /> : <I.Sync size={18} />}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{privacy?.title}</div>
      <div className="dim" style={{ fontSize: 10.5, marginTop: 2 }}>
        {[draft.stripAttendees && "no attendees", draft.workingHoursOnly && "work hrs", draft.hideWeekends && "no weekends"].filter(Boolean).join(" · ") || "no filters"}
      </div>
    </div>
  );
}

Object.assign(window, { SyncScreen });
