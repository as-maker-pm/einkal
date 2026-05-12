// data.jsx — mock data, store, and helpers
// ───────────────────────────────────────────────────────────────────

// Connected calendar accounts (Google / Microsoft) and their sub-calendars.
const INITIAL_ACCOUNTS = [
  {
    id: "acc-1",
    provider: "google",
    email: "alex@levitatedata.com",
    label: "Work",
    connectedAt: "2025-09-12",
    status: "active",
    calendars: [
      { id: "cal-1", name: "alex@levitatedata.com", color: "#4f78e8", primary: true, visible: true, role: "owner" },
      { id: "cal-2", name: "Team standups", color: "#2f9e6a", primary: false, visible: true, role: "writer" },
      { id: "cal-3", name: "Customer calls", color: "#dc6c9b", primary: false, visible: true, role: "writer" },
      { id: "cal-4", name: "Holidays — US", color: "#7eb069", primary: false, visible: false, role: "reader" },
    ],
  },
  {
    id: "acc-2",
    provider: "google",
    email: "alex.coleman@gmail.com",
    label: "Personal",
    connectedAt: "2025-09-12",
    status: "active",
    calendars: [
      { id: "cal-5", name: "alex.coleman@gmail.com", color: "#a45fc6", primary: true, visible: true, role: "owner" },
      { id: "cal-6", name: "Family", color: "#f08a3c", primary: false, visible: true, role: "owner" },
      { id: "cal-7", name: "Gym & training", color: "#3da5b0", primary: false, visible: true, role: "owner" },
    ],
  },
  {
    id: "acc-3",
    provider: "microsoft",
    email: "alex@acme.consulting",
    label: "Consulting",
    connectedAt: "2025-10-04",
    status: "active",
    calendars: [
      { id: "cal-8", name: "alex@acme.consulting", color: "#e25c5c", primary: true, visible: true, role: "owner" },
      { id: "cal-9", name: "Client — Northwind", color: "#9783e3", primary: false, visible: true, role: "writer" },
    ],
  },
];

// Sync flow definitions
const INITIAL_FLOWS = [
  {
    id: "flow-1",
    name: "Hide work meetings on personal",
    sources: ["cal-1", "cal-2", "cal-3"],
    destinations: ["cal-5"],
    direction: "one-way",
    privacy: "busy",
    template: "Busy",
    stripAttendees: true,
    workingHoursOnly: false,
    hideWeekends: false,
    declined: "skip",
    paused: false,
    lastRun: "2 min ago",
    eventsSynced: 142,
  },
  {
    id: "flow-2",
    name: "Mirror personal blocks to work",
    sources: ["cal-6", "cal-7"],
    destinations: ["cal-1"],
    direction: "one-way",
    privacy: "template",
    template: "Personal — Busy",
    stripAttendees: true,
    workingHoursOnly: true,
    hideWeekends: false,
    declined: "skip",
    paused: false,
    lastRun: "8 min ago",
    eventsSynced: 38,
  },
  {
    id: "flow-3",
    name: "Two-way sync: Work ⇄ Consulting",
    sources: ["cal-1"],
    destinations: ["cal-8"],
    direction: "two-way",
    privacy: "title",
    template: "",
    stripAttendees: false,
    workingHoursOnly: false,
    hideWeekends: true,
    declined: "skip",
    paused: false,
    lastRun: "just now",
    eventsSynced: 412,
  },
  {
    id: "flow-4",
    name: "Customer calls → exec visibility",
    sources: ["cal-3"],
    destinations: ["cal-9"],
    direction: "one-way",
    privacy: "full",
    template: "",
    stripAttendees: false,
    workingHoursOnly: false,
    hideWeekends: false,
    declined: "include",
    paused: true,
    lastRun: "3h ago",
    eventsSynced: 56,
  },
];

const INITIAL_TEAM = [
  { id: "u-1", name: "Alex Coleman", email: "alex@einkal.com", role: "owner", avatarColor: "#2ECC71", you: true },
  { id: "u-2", name: "Priya Raman", email: "priya@einkal.com", role: "admin" },
  { id: "u-3", name: "Marco Velez", email: "marco@einkal.com", role: "member" },
  { id: "u-4", name: "Sara Lindqvist", email: "sara@einkal.com", role: "member" },
  { id: "u-5", name: "Jun Park", email: "jun@einkal.com", role: "billing" },
];

const ACTIVITY = [
  { id: 1, t: "just now", text: "Synced 'Two-way sync: Work ⇄ Consulting'", events: 3, kind: "sync" },
  { id: 2, t: "2 min ago", text: "Hidden 1 event on Personal — 'Q4 board review' became 'Busy'", kind: "privacy" },
  { id: 3, t: "8 min ago", text: "Mirrored 'Yoga' from Personal → Work as 'Personal — Busy'", kind: "sync" },
  { id: 4, t: "26 min ago", text: "Created new flow 'Mirror personal blocks to work'", kind: "flow" },
  { id: 5, t: "1h ago", text: "Resolved conflict on Sept 14: kept Customer Call over Coffee chat", kind: "conflict" },
  { id: 6, t: "3h ago", text: "Paused 'Customer calls → exec visibility'", kind: "pause" },
  { id: 7, t: "Yesterday", text: "Priya joined the team as Admin", kind: "team" },
  { id: 8, t: "Yesterday", text: "Connected alex@acme.consulting (Microsoft)", kind: "connect" },
];

const PRIVACY_PRESETS = [
  { id: "busy", title: "Busy only", body: "Just blocks time. No title, no details. Maximum privacy.", icon: "lock" },
  { id: "title", title: "Title only", body: "Show event title. Hide description, location, attendees.", icon: "tag" },
  { id: "titletime", title: "Title + time", body: "Title + start/end. Strip everything else.", icon: "clock" },
  { id: "full", title: "Full details", body: "Mirror everything: title, description, attendees, location.", icon: "eye" },
  { id: "template", title: "Custom title template", body: "Replace title with a template you write. e.g. 'Busy — Work'.", icon: "edit" },
];

// ───────────────────────────────────────────────────────────────────
// Store — lightweight reactive store. useStore() reads, useDispatch() writes.
// ───────────────────────────────────────────────────────────────────
const StoreCtx = React.createContext(null);

function StoreProvider({ children }) {
  const [state, setState] = React.useState({
    accounts: INITIAL_ACCOUNTS,
    flows: INITIAL_FLOWS,
    team: INITIAL_TEAM,
    activity: ACTIVITY,
    org: {
      name: "Acme, Inc.",
      slug: "acme",
      plan: "Team",
      seats: 5,
      seatsUsed: 5,
      timezone: "America/Los_Angeles",
    },
    user: { id: "u-1", name: "Alex Coleman", email: "alex@einkal.com" },
  });

  const actions = React.useMemo(() => ({
    updateCalendar: (calId, patch) => setState(s => ({
      ...s,
      accounts: s.accounts.map(a => ({
        ...a,
        calendars: a.calendars.map(c => c.id === calId ? { ...c, ...patch } : c),
      })),
    })),
    removeAccount: (accId) => setState(s => ({
      ...s,
      accounts: s.accounts.filter(a => a.id !== accId),
    })),
    addAccount: (acc) => setState(s => ({ ...s, accounts: [...s.accounts, acc] })),
    addFlow: (flow) => setState(s => ({ ...s, flows: [{ ...flow, id: "flow-" + Math.random().toString(36).slice(2, 7) }, ...s.flows] })),
    updateFlow: (id, patch) => setState(s => ({
      ...s, flows: s.flows.map(f => f.id === id ? { ...f, ...patch } : f),
    })),
    removeFlow: (id) => setState(s => ({ ...s, flows: s.flows.filter(f => f.id !== id) })),
    addTeammate: (u) => setState(s => ({ ...s, team: [...s.team, { ...u, id: "u-" + Math.random().toString(36).slice(2, 6) }] })),
    removeTeammate: (id) => setState(s => ({ ...s, team: s.team.filter(u => u.id !== id) })),
    updateTeammate: (id, patch) => setState(s => ({ ...s, team: s.team.map(u => u.id === id ? { ...u, ...patch } : u) })),
    pushActivity: (text, kind = "sync") => setState(s => ({
      ...s,
      activity: [{ id: Date.now(), t: "just now", text, kind }, ...s.activity].slice(0, 30),
    })),
    updateOrg: (patch) => setState(s => ({ ...s, org: { ...s.org, ...patch } })),
  }), []);

  return <StoreCtx.Provider value={{ state, ...actions }}>{children}</StoreCtx.Provider>;
}

const useStore = () => React.useContext(StoreCtx);

// helper: find calendar by id across accounts
function findCalendar(accounts, calId) {
  for (const a of accounts) {
    const c = a.calendars.find(c => c.id === calId);
    if (c) return { ...c, account: a };
  }
  return null;
}

Object.assign(window, {
  INITIAL_ACCOUNTS, INITIAL_FLOWS, INITIAL_TEAM, ACTIVITY, PRIVACY_PRESETS,
  StoreProvider, useStore, findCalendar,
});
