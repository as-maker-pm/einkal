// screens-misc.jsx — Dashboard, Team, Settings, Billing

const { useState: useStateM, useMemo: useMemoM } = React;

// ───────────────────────────────────────────────────────────────
// Dashboard
// ───────────────────────────────────────────────────────────────
function DashboardScreen({ onNav }) {
  const { state } = useStore();
  const activeFlows = state.flows.filter(f => !f.paused);
  const totalSynced = state.flows.reduce((s, f) => s + f.eventsSynced, 0);
  const calCount = state.accounts.reduce((s, a) => s + a.calendars.length, 0);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title={`Hey, ${state.user.name.split(" ")[0]}.`}
        actions={
          <>
            <button className="btn" onClick={() => onNav("calendars")}><I.Plus size={13} /> Connect calendar</button>
            <button className="btn primary" onClick={() => onNav("sync", { newFlow: true })}><I.Plus size={13} /> New flow</button>
          </>
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
        {/* metrics */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          marginBottom: 24,
          border: "0.5px solid var(--border)", borderRadius: 12,
          background: "var(--panel)", overflow: "hidden",
        }}>
          <MetricCell label="Active flows" value={activeFlows.length} hint={`${state.flows.length} total`} />
          <MetricCell label="Calendars" value={calCount} hint={`${state.accounts.length} accounts`} />
          <MetricCell label="Events synced" value={totalSynced.toLocaleString()} hint="last 30 days" />
          <MetricCell label="Status" value={<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className="pulse" /><span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>All normal</span></span>} hint="last check 12s ago" raw />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
          {/* flows preview — primary */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--divider)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Sync flows</div>
              <span className="dim" style={{ fontSize: 12 }}>· {activeFlows.length} running</span>
              <div style={{ flex: 1 }} />
              <button className="btn ghost sm" onClick={() => onNav("sync")}>Manage <I.ArrowRight size={11} /></button>
            </div>
            <div>
              {state.flows.slice(0, 5).map((f, i) => <MiniFlowRow key={f.id} flow={f} divider={i > 0} onClick={() => onNav("sync", { flowId: f.id })} />)}
            </div>
          </div>

          {/* activity — secondary, neutral */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid var(--divider)" }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Recent activity</div>
              <div style={{ flex: 1 }} />
              <button className="btn ghost sm">View all</button>
            </div>
            <div style={{ maxHeight: 440, overflow: "auto" }}>
              {state.activity.slice(0, 10).map(a => <ActivityRow key={a.id} item={a} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, hint, raw }) {
  return (
    <div style={{
      padding: "16px 20px",
      borderRight: "0.5px solid var(--divider)",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontSize: 11.5, color: "var(--dim)", fontWeight: 450, letterSpacing: "0.01em" }}>{label}</div>
      {raw ? value : (
        <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.025em", color: "var(--text)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      )}
      {hint && <div style={{ fontSize: 11, color: "var(--muted)" }}>{hint}</div>}
    </div>
  );
}

function InlineStat({ label, value, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</span>
      </div>
      {hint && <div className="dim" style={{ fontSize: 10.5 }}>{hint}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ width: 0.5, alignSelf: "stretch", background: "var(--divider)" }} />;
}

function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div className="card" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ color: accent ? "var(--accent)" : "var(--dim)" }}>{icon}</div>
        <span style={{ fontSize: 11.5, color: "var(--dim)", fontWeight: 450 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1, color: accent ? "var(--accent)" : "var(--text)" }}>
        {value}
      </div>
      <div className="dim" style={{ fontSize: 11.5, marginTop: 6 }}>{sub}</div>
    </div>
  );
}

function DayPreview() {
  const events = [
    { t: "9:00", end: "9:30", cal: "Work", color: "#4f78e8", title: "Team standup", attendees: 7 },
    { t: "10:00", end: "11:00", cal: "Personal", color: "#a45fc6", title: "Busy", mirror: true },
    { t: "11:30", end: "12:30", cal: "Work", color: "#dc6c9b", title: "Northwind — Q4 review", attendees: 3 },
    { t: "1:00", end: "2:00", cal: "Personal", color: "#f08a3c", title: "Lunch with Sara" },
    { t: "2:30", end: "3:30", cal: "Consulting", color: "#e25c5c", title: "Client kickoff" },
    { t: "4:00", end: "4:30", cal: "Personal", color: "#3da5b0", title: "Yoga" },
  ];
  return (
    <div style={{ padding: "10px 4px 16px 0", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 0 }}>
        {events.map((e, i) => (
          <React.Fragment key={i}>
            <div style={{ padding: "10px 16px 6px", textAlign: "right" }}>
              <div className="mono dim" style={{ fontSize: 11 }}>{e.t}</div>
            </div>
            <div style={{ padding: "6px 18px 6px 0", borderTop: i === 0 ? "none" : "0.5px solid var(--divider)" }}>
              <div style={{
                padding: "9px 11px", borderRadius: 7,
                background: "color-mix(in oklab, " + e.color + " 13%, transparent)",
                borderLeft: `2.5px solid ${e.color}`,
                display: "flex", alignItems: "center", gap: 9,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: e.title === "Busy" ? "var(--dim)" : "var(--text)" }}>{e.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span className="dim" style={{ fontSize: 11 }}>{e.cal} · {e.t}–{e.end}</span>
                    {e.mirror && (
                      <span style={{ fontSize: 9.5, color: "var(--accent)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        ← mirrored
                      </span>
                    )}
                  </div>
                </div>
                {e.attendees && (
                  <div style={{ display: "flex", marginLeft: "auto" }}>
                    {Array.from({ length: Math.min(e.attendees, 3) }, (_, j) => (
                      <Avatar key={j} name={["Priya", "Marco", "Sara", "Jun", "Kira"][j]} size={20} />
                    )).map((a, j) => React.cloneElement(a, { style: { marginLeft: j === 0 ? 0 : -6, border: "1.5px solid var(--panel)" } }))}
                    {e.attendees > 3 && <span style={{
                      width: 20, height: 20, borderRadius: "50%", marginLeft: -6,
                      background: "var(--surface-hi)", border: "1.5px solid var(--panel)",
                      fontSize: 9.5, fontWeight: 500, color: "var(--dim)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>+{e.attendees - 3}</span>}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ item }) {
  const iconMap = {
    sync: <I.Sync size={12} />,
    flow: <I.Plus size={12} />,
    privacy: <I.Lock size={12} />,
    conflict: <I.Warning size={12} />,
    pause: <I.Pause size={12} />,
    team: <I.Team size={12} />,
    connect: <I.Link size={12} />,
  };
  const colorMap = {
    sync: "var(--dim)", flow: "var(--accent)", privacy: "var(--dim)",
    conflict: "var(--warn)", pause: "var(--dim)", team: "var(--dim)", connect: "var(--dim)",
  };
  return (
    <div style={{
      padding: "10px 18px",
      display: "flex", alignItems: "flex-start", gap: 10,
      borderTop: "0.5px solid var(--divider)",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: "var(--surface)",
        color: colorMap[item.kind] || "var(--dim)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        marginTop: 1,
      }}>{iconMap[item.kind] || <I.Activity size={12} />}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{item.text}</div>
        <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>{item.t}</div>
      </div>
    </div>
  );
}

function MiniFlowRow({ flow, divider, onClick }) {
  const { state } = useStore();
  const srcs = flow.sources.map(id => findCalendar(state.accounts, id)).filter(Boolean).slice(0, 2);
  const dsts = flow.destinations.map(id => findCalendar(state.accounts, id)).filter(Boolean).slice(0, 2);
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "9px 18px",
      display: "flex", alignItems: "center", gap: 12, textAlign: "left",
      borderTop: divider ? "0.5px solid var(--divider)" : "none",
      transition: "background 0.12s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 450, color: "var(--text)" }}>{flow.name}</div>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 18px 1fr",
          alignItems: "center", gap: 0, marginTop: 8,
          background: "var(--surface)", border: "0.5px solid var(--border)",
          borderRadius: 8, padding: "8px 10px",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {srcs.map(c => (
              <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", color: "var(--dim)" }}>
            {flow.direction === "two-way" ? <I.ArrowsLR size={16} /> : <I.ArrowRight size={16} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {dsts.map(c => (
              <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="dim" style={{ fontSize: 10.5, marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
          <span className="tabnum">{flow.eventsSynced}</span> events
          <span style={{ color: "var(--muted)" }}>·</span>
          <span>last run {flow.lastRun || "2m ago"}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5 }}>
        {flow.paused ? (
          <span className="dim">Paused</span>
        ) : (
          <>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ok)" }} />
            <span style={{ color: "var(--text-2)" }}>Running</span>
          </>
        )}
      </div>
      <I.Chevron size={13} style={{ color: "var(--dim)" }} />
    </button>
  );
}

// ───────────────────────────────────────────────────────────────
// Team
// ───────────────────────────────────────────────────────────────
function TeamScreen() {
  const { state, addTeammate, updateTeammate, removeTeammate, pushActivity } = useStore();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useStateM(false);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Team"
        subtitle={`${state.team.length} member${state.team.length === 1 ? "" : "s"} · everyone connects their own calendars. You manage who's in.`}
        actions={<button className="btn primary" onClick={() => setInviteOpen(true)}><I.Plus size={13} /> Invite</button>}
      />

      <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.5fr 1fr 120px 90px 40px", gap: 14,
            padding: "10px 18px", borderBottom: "0.5px solid var(--divider)",
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)",
          }}>
            <span>Member</span><span>Email</span><span>Role</span><span>Calendars</span><span></span>
          </div>
          {state.team.map((u, i) => (
            <TeamRow key={u.id} u={u}
              calendars={state.accounts.filter(a => u.you ? true : Math.random() > 0.3).length}
              onRoleChange={(role) => { updateTeammate(u.id, { role }); toast(`${u.name} is now ${role}`, "info"); }}
              onRemove={() => { if (confirm(`Remove ${u.name} from the workspace?`)) { removeTeammate(u.id); pushActivity(`Removed ${u.name}`, "team"); toast(`${u.name} removed`, "info"); } }}
              divider={i > 0}
            />
          ))}
        </div>

        {/* invite hint */}
        <div className="card" style={{ marginTop: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--accent-bg)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><I.Link size={16} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Magic invite link</div>
            <div className="dim" style={{ fontSize: 12, marginTop: 2 }}>Anyone with this link and a <strong style={{ color: "var(--text-2)" }}>@levitatedata.com</strong> email can join.</div>
          </div>
          <input className="input" style={{ width: 320, fontFamily: "var(--font-mono)", fontSize: 12 }} readOnly value="https://einkal.com/join/lvtd-7a3kqz" />
          <button className="btn" onClick={() => toast("Copied to clipboard", "ok")}><I.Copy size={12} /> Copy</button>
        </div>
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={(rows) => {
        rows.filter(r => r.email).forEach(r => addTeammate({ name: r.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()), email: r.email, role: r.role, invited: true }));
        pushActivity(`Invited ${rows.filter(r => r.email).length} teammate(s)`, "team");
        toast("Invites sent", "ok");
        setInviteOpen(false);
      }} />
    </div>
  );
}

function TeamRow({ u, calendars, onRoleChange, onRemove, divider }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1.5fr 1fr 120px 90px 40px", gap: 14,
      padding: "12px 18px", alignItems: "center",
      borderTop: divider ? "0.5px solid var(--divider)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={u.name} size={28} color={u.avatarColor} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name} {u.you && <span className="dim" style={{ fontWeight: 400 }}>(you)</span>}</div>
          {u.invited && <div style={{ fontSize: 10.5, color: "var(--warn)", marginTop: 1 }}>Invite pending</div>}
        </div>
      </div>
      <span className="dim mono" style={{ fontSize: 11.5 }}>{u.email}</span>
      <select className="input select" disabled={u.you} style={{ height: 26, fontSize: 12 }}
        value={u.role} onChange={(e) => onRoleChange(e.target.value)}>
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
        <option value="member">Member</option>
        <option value="billing">Billing only</option>
      </select>
      <span style={{ fontSize: 12, color: "var(--text-2)" }}>{calendars}</span>
      {!u.you && <button className="iconbtn" onClick={onRemove}><I.More size={14} /></button>}
    </div>
  );
}

function InviteModal({ open, onClose, onInvite }) {
  const [rows, setRows] = useStateM([{ email: "", role: "member" }, { email: "", role: "member" }]);
  React.useEffect(() => { if (open) setRows([{ email: "", role: "member" }, { email: "", role: "member" }]); }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Invite teammates" width={520}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => onInvite(rows)}><I.Mail size={12} /> Send invites</button>
      </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input className="input" style={{ flex: 1 }} placeholder="teammate@company.com" value={r.email}
              onChange={(e) => setRows(rs => rs.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} />
            <select className="input select" style={{ width: 130 }} value={r.role}
              onChange={(e) => setRows(rs => rs.map((x, j) => j === i ? { ...x, role: e.target.value } : x))}>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="billing">Billing only</option>
            </select>
            <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}><I.X size={13} /></button>
          </div>
        ))}
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setRows(rs => [...rs, { email: "", role: "member" }])}>
          <I.Plus size={12} /> Add another
        </button>
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────────────────────────────
// Settings
// ───────────────────────────────────────────────────────────────
function SettingsScreen() {
  const { state, updateOrg } = useStore();
  const toast = useToast();
  const [tab, setTab] = useStateM("workspace");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Settings" subtitle="Workspace settings, notifications, and security." />

      <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
        <div style={{ maxWidth: 720 }}>
          <Tabs value={tab} onChange={setTab} options={[
            { value: "workspace", label: "Workspace" },
            { value: "notifications", label: "Notifications" },
            { value: "security", label: "Security" },
            { value: "danger", label: "Danger zone" },
          ]} />

          {tab === "workspace" && (
            <SettingsCard title="Workspace details">
              <Field label="Workspace name">
                <input className="input" value={state.org.name} onChange={(e) => updateOrg({ name: e.target.value })} />
              </Field>
              <Field label="URL slug" help="Used in invite links and the workspace URL.">
                <div style={{ position: "relative" }}>
                  <input className="input" value={state.org.slug} onChange={(e) => updateOrg({ slug: e.target.value })} style={{ paddingLeft: 84 }} />
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--dim)", fontSize: 13, fontFamily: "var(--font-mono)" }}>einkal.com/</span>
                </div>
              </Field>
              <Field label="Default timezone">
                <select className="input select" value={state.org.timezone} onChange={(e) => updateOrg({ timezone: e.target.value })}>
                  <option>America/Los_Angeles</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>Asia/Singapore</option>
                  <option>Asia/Kolkata</option>
                </select>
              </Field>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button className="btn primary" onClick={() => toast("Saved", "ok")}>Save changes</button>
              </div>
            </SettingsCard>
          )}

          {tab === "notifications" && (
            <SettingsCard title="What we email you about">
              <NotifRow label="Sync conflicts" desc="When EinKal can't resolve a conflict automatically." defaultOn />
              <NotifRow label="Failed syncs" desc="A provider rejected a write, or we lost permissions." defaultOn />
              <NotifRow label="New teammate joins" desc="Someone accepts an invite." />
              <NotifRow label="Weekly digest" desc="Friday summary: events synced, flows, anomalies." defaultOn />
              <NotifRow label="Product updates" desc="New features, occasional announcements." />
            </SettingsCard>
          )}

          {tab === "security" && (
            <SettingsCard title="Security">
              <Field label="Require SSO" help="Force all members to sign in via your identity provider.">
                <Segmented value="off" onChange={() => { }} options={["Off", "Recommended", "Required"]} />
              </Field>
              <Field label="Session length" help="How long teammates stay signed in before re-authenticating.">
                <select className="input select"><option>7 days</option><option>30 days</option><option>90 days</option></select>
              </Field>
              <NotifRow label="Two-factor authentication" desc="Require 2FA for all admins and owners." defaultOn />
              <NotifRow label="Audit log" desc="Track every sync, connection, and admin action." defaultOn />
            </SettingsCard>
          )}

          {tab === "danger" && (
            <SettingsCard title="Danger zone" danger>
              <div style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 14, borderBottom: "0.5px solid var(--divider)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>Pause all syncs</div>
                  <div className="dim" style={{ fontSize: 12 }}>Stop every flow in this workspace. You can resume any time.</div>
                </div>
                <button className="btn" onClick={() => toast("All syncs paused", "warn")}><I.Pause size={12} /> Pause all</button>
              </div>
              <div style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 14, borderBottom: "0.5px solid var(--divider)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>Disconnect all calendars</div>
                  <div className="dim" style={{ fontSize: 12 }}>Remove every connected account. Mirror events stay where they are.</div>
                </div>
                <button className="btn danger">Disconnect</button>
              </div>
              <div style={{ padding: "12px 0", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--danger)" }}>Delete workspace</div>
                  <div className="dim" style={{ fontSize: 12 }}>Permanent. All flows, connections, and history are erased.</div>
                </div>
                <button className="btn danger">Delete workspace</button>
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, children, danger }) {
  return (
    <div className="card" style={{ padding: "18px 22px", borderColor: danger ? "color-mix(in oklab, var(--danger) 30%, var(--border))" : undefined }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 14, color: danger ? "var(--danger)" : "var(--text)" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, help, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {help && <div className="help">{help}</div>}
    </div>
  );
}

function NotifRow({ label, desc, defaultOn }) {
  const [on, setOn] = useStateM(!!defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "0.5px solid var(--divider)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 450 }}>{label}</div>
        <div className="dim" style={{ fontSize: 12, marginTop: 1 }}>{desc}</div>
      </div>
      <button className={"toggle " + (on ? "on" : "")} onClick={() => setOn(o => !o)} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Billing
// ───────────────────────────────────────────────────────────────
function BillingScreen() {
  const { state } = useStore();
  const invoices = [
    { id: "INV-2026-011", date: "Nov 1, 2026", amount: "$60.00", status: "paid" },
    { id: "INV-2026-010", date: "Oct 1, 2026", amount: "$60.00", status: "paid" },
    { id: "INV-2026-009", date: "Sep 1, 2026", amount: "$48.00", status: "paid" },
    { id: "INV-2026-008", date: "Aug 1, 2026", amount: "$36.00", status: "paid" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Billing" subtitle="Plan, seats, payment, and invoices." />

      <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
          {/* current plan */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span className="chip" style={{ color: "var(--accent)", borderColor: "color-mix(in oklab, var(--accent) 40%, var(--border))", background: "var(--accent-bg)" }}>
                <I.Sparkles size={10} /> {state.org.plan} plan
              </span>
              <span className="dim" style={{ fontSize: 12 }}>renews Dec 1, 2026</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              <BillingStat label="Seats" value={`${state.org.seatsUsed} / ${state.org.seats}`} sub="$12 / seat / mo" />
              <BillingStat label="Active flows" value={state.flows.filter(f => !f.paused).length} sub="unlimited included" />
              <BillingStat label="This month" value="$60" sub="next invoice" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button className="btn primary">Upgrade to Scale</button>
              <button className="btn">Add seats</button>
              <button className="btn">Manage plan</button>
            </div>
          </div>

          {/* payment */}
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Payment method
            </div>
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "linear-gradient(135deg, #1a1a1a, #2a2520)",
              border: "0.5px solid var(--border-hi)", color: "#e8e6e0",
              fontFamily: "var(--font-mono)", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 30%, transparent), transparent)" }} />
              <div style={{ fontSize: 11, color: "#8a8580" }}>VISA · ending 4242</div>
              <div style={{ marginTop: 12, fontSize: 14, letterSpacing: "0.18em" }}>•••• •••• •••• 4242</div>
              <div style={{ marginTop: 8, fontSize: 10, color: "#8a8580" }}>EXPIRES 09/29</div>
            </div>
            <button className="btn sm" style={{ marginTop: 12 }}>Update card</button>
          </div>
        </div>

        {/* invoices */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", borderBottom: "0.5px solid var(--divider)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Invoices</div>
            <div style={{ flex: 1 }} />
            <button className="btn ghost sm"><I.ExtLink size={11} /> Tax & receipts</button>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 100px 80px 60px", gap: 14,
            padding: "10px 18px", borderBottom: "0.5px solid var(--divider)",
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)",
          }}>
            <span>Invoice</span><span>Date</span><span>Amount</span><span>Status</span><span></span>
          </div>
          {invoices.map((inv, i) => (
            <div key={inv.id} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 100px 80px 60px", gap: 14,
              padding: "11px 18px", alignItems: "center",
              borderTop: i === 0 ? "none" : "0.5px solid var(--divider)",
              fontSize: 13,
            }}>
              <span className="mono" style={{ fontSize: 12 }}>{inv.id}</span>
              <span className="dim">{inv.date}</span>
              <span className="mono">{inv.amount}</span>
              <span style={{ color: "var(--ok)", fontSize: 11.5 }}>● {inv.status}</span>
              <button className="btn ghost sm"><I.ExtLink size={11} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingStat({ label, value, sub }) {
  return (
    <div>
      <div className="dim" style={{ fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}>{value}</div>
      <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { DashboardScreen, TeamScreen, SettingsScreen, BillingScreen });
