import { lazy, Suspense, useEffect, useState } from "react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Aperture,
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Command,
  CreditCard,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Plus,
  Search,
  Settings,
  Users,
  X,
  Camera,
  Check,
  Sparkles,
} from "lucide-react";
import { useStudio } from "./data/store";
import { balance, brand, clientFor, dateLabel, money } from "./data/utils";
import { ActionProvider, useActions } from "./components/actions";
import { Avatar, Badge, Empty, Field, Modal, Toasts } from "./components/ui";
import { PageSkeleton } from "./components/PageSkeleton";
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Bookings = lazy(() =>
  import("./pages/Bookings").then((m) => ({ default: m.Bookings })),
);
const BookingDetail = lazy(() =>
  import("./pages/BookingDetail").then((m) => ({ default: m.BookingDetail })),
);
const CalendarPage = lazy(() =>
  import("./pages/Calendar").then((m) => ({ default: m.CalendarPage })),
);
const Payments = lazy(() =>
  import("./pages/Payments").then((m) => ({ default: m.Payments })),
);
const Clients = lazy(() =>
  import("./pages/Clients").then((m) => ({ default: m.Clients })),
);
const ClientProfile = lazy(() =>
  import("./pages/Clients").then((m) => ({ default: m.ClientProfile })),
);
const Projects = lazy(() =>
  import("./pages/Projects").then((m) => ({ default: m.Projects })),
);
const ProjectDetail = lazy(() =>
  import("./pages/Projects").then((m) => ({ default: m.ProjectDetail })),
);
const Deliverables = lazy(() =>
  import("./pages/Projects").then((m) => ({ default: m.Deliverables })),
);
const SettingsPage = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.SettingsPage })),
);
const navigation = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/bookings", label: "Bookings", icon: Camera },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/payments", label: "Payments", icon: CreditCard },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/deliverables", label: "Deliverables", icon: PackageCheck },
];
export default function App() {
  return (
    <ActionProvider>
      <Shell />
    </ActionProvider>
  );
}
function Shell() {
  const { data } = useStudio(),
    { open } = useActions();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [notifications, setNotifications] = useState(false),
    [onboarding, setOnboarding] = useState(false),
    [help, setHelp] = useState(false);
  const unread = data.notifications.filter((n) => !n.read).length;
  const page =
    navigation.find(
      (n) => n.path !== "/" && location.pathname.startsWith(n.path),
    )?.label ||
    (location.pathname.startsWith("/settings") ? "Settings" : "Overview");
  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);
  useEffect(() => {
    function keys(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (
        e.key.toLowerCase() === "n" &&
        !(e.metaKey || e.ctrlKey || e.altKey) &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        ) &&
        !document.querySelector('[role="dialog"]')
      )
        open({ kind: "booking" });
    }
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [open]);
  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      {mobile && <div className="nav-scrim" onClick={() => setMobile(false)} />}
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <NavLink to="/" className="brand">
          <span className="brand-symbol">
            <Aperture size={25} strokeWidth={2} />
          </span>
          <span>
            {brand.name}
            <small>STUDIO WORKSPACE</small>
          </span>
        </NavLink>
        <button
          className="studio-switch"
          onClick={() => setOnboarding(true)}
          title="Set up your studio"
        >
          <Avatar name={data.settings.name} />
          <span>
            <strong>{data.settings.name}</strong>
            <small>Studio workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-section-label">WORKSPACE</div>
        <nav>
          {navigation.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === "/"}
              aria-label={n.label}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <n.icon size={19} strokeWidth={1.8} />
              <span>{n.label}</span>
              {n.label === "Bookings" && (
                <small>
                  {
                    data.bookings.filter(
                      (b) => !["Completed"].includes(b.status),
                    ).length
                  }
                </small>
              )}
              {n.label === "Payments" && <i className="nav-attention" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => setNotifications(true)}
            title="Notifications"
          >
            <Bell size={19} />
            <span>Notifications</span>
            {unread > 0 && <small>{unread}</small>}
          </button>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            title="Settings"
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
          <div className="studio-note">
            <span className="note-icon">
              <Sparkles size={16} />
            </span>
            <strong>Your craft, in focus.</strong>
            <p>We’ll take care of the details.</p>
            <button onClick={() => setHelp(true)}>
              Explore your workspace
              <ArrowRight size={13} />
            </button>
          </div>
          <NavLink to="/settings" className="profile">
            <Avatar name={data.settings.owner} />
            <span>
              <strong>{data.settings.owner}</strong>
              <small>Studio owner</small>
            </span>
            <ChevronDown size={14} />
          </NavLink>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft size={15} className={collapsed ? "rotated" : ""} />
            <span>Collapse sidebar</span>
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-studio">
              Workspace<span>/</span>
            </span>
            <strong>{page}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search-button"
              aria-label="Search workspace"
              onClick={() => setSearch(true)}
            >
              <Search size={16} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="btn primary top-create"
              title="New booking (N)"
              onClick={() => open({ kind: "booking" })}
            >
              <Plus size={17} />
              <span>New Booking</span>
            </button>
            <span className="top-divider" />
            <button
              className="icon-button notification-bell"
              aria-label="Open notifications"
              onClick={() => setNotifications(true)}
            >
              <Bell size={19} />
              {unread > 0 && <i />}
            </button>
            <NavLink to="/settings" aria-label="Your profile">
              <Avatar name={data.settings.owner} small />
            </NavLink>
          </div>
        </header>
        <main className="page-content">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route
                path="/"
                element={<Dashboard setup={() => setOnboarding(true)} />}
              />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientProfile />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/deliverables" element={<Deliverables />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="*"
                element={
                  <Empty
                    title="This page has moved"
                    action={
                      <NavLink className="btn primary" to="/">
                        Go to overview
                      </NavLink>
                    }
                  >
                    Your studio is waiting on the overview.
                  </Empty>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <footer className="app-footer">
          <span>
            <span className="live-dot" />
            All changes saved locally
          </span>
          <span>Demo workspace · 10 October 2026</span>
          <button onClick={() => setHelp(true)}>
            <HelpCircle size={14} />
            Help & shortcuts
          </button>
        </footer>
      </div>
      {search && <SearchDialog close={() => setSearch(false)} />}
      {notifications && <Notifications close={() => setNotifications(false)} />}
      {onboarding && <Onboarding close={() => setOnboarding(false)} />}
      {help && (
        <Modal
          title="Less admin. More photography."
          subtitle="Your quick guide to FrameFlow."
          onClose={() => setHelp(false)}
        >
          <div className="modal-body">
            <div className="help-item">
              <kbd>⌘ / Ctrl K</kbd>
              <span>Search clients, bookings, projects, and payments</span>
            </div>
            <div className="help-item">
              <kbd>N</kbd>
              <span>Create a booking from any page</span>
            </div>
            <div className="help-item">
              <kbd>Esc</kbd>
              <span>Close a dialog or drawer</span>
            </div>
            <p className="section-gap">
              Drag bookings between pipeline stages. Click or drag on the
              calendar to block time. Record payments to update balances and
              milestones everywhere.
            </p>
            <div className="inline-info">
              <Sparkles size={18} />
              This validation prototype saves to this browser. Real payment
              collection, messaging, and file hosting are future integrations.
            </div>
          </div>
        </Modal>
      )}
      <Toasts />
    </div>
  );
}
function SearchDialog({ close }: { close: () => void }) {
  const { data } = useStudio();
  const navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(0);
  const q = query.toLowerCase().trim();
  const entries = data.bookings
    .filter((b) =>
      `${clientFor(data, b).name} ${clientFor(data, b).phone} ${b.eventType} ${b.venue}`
        .toLowerCase()
        .includes(q),
    )
    .flatMap((b) => {
      const client = clientFor(data, b),
        project = data.projects.find((p) => p.bookingId === b.id)!;
      return [
        {
          title: client.name,
          detail: `${b.eventType} · ${dateLabel(b.eventDate)} · ${b.status}`,
          category: "Booking",
          path: `/bookings/${b.id}`,
        },
        {
          title: client.name,
          detail: `${client.phone} · ${client.email}`,
          category: "Client",
          path: `/clients/${client.id}`,
        },
        {
          title: `${client.name} · ${b.eventType}`,
          detail: `${project.status} · Delivery ${dateLabel(project.deadline)}`,
          category: "Project",
          path: `/projects/${project.id}`,
        },
        ...(balance(b)
          ? [
              {
                title: `${money(balance(b))} pending`,
                detail: `${client.name} · ${b.eventType}`,
                category: "Payment",
                path: `/bookings/${b.id}?tab=Payments`,
              },
            ]
          : []),
      ];
    })
    .slice(0, q ? 24 : 8);
  function go(index: number) {
    if (entries[index]) {
      navigate(entries[index].path);
      close();
    }
  }
  return (
    <Modal title="Search your workspace" onClose={close} wide>
      <div className="command-input">
        <Search size={20} />
        <input
          autoFocus
          placeholder="Search clients, events, phone numbers..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((s) => Math.min(entries.length - 1, s + 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((s) => Math.max(0, s - 1));
            }
            if (e.key === "Enter") go(selected);
          }}
        />
        <kbd>ESC</kbd>
      </div>
      <div className="search-results">
        {entries.map((e, i) => (
          <button
            className={`search-result ${selected === i ? "selected" : ""}`}
            key={e.path}
            onClick={() => go(i)}
            onMouseEnter={() => setSelected(i)}
          >
            <span className="search-result-icon">
              {e.category === "Payment" ? (
                <CreditCard size={19} />
              ) : e.category === "Project" ? (
                <FolderKanban size={19} />
              ) : e.category === "Client" ? (
                <Users size={19} />
              ) : (
                <Camera size={19} />
              )}
            </span>
            <span>
              <strong>{e.title}</strong>
              <small>{e.detail}</small>
            </span>
            <Badge tone="neutral">{e.category}</Badge>
            <ArrowRight size={15} />
          </button>
        ))}
        {!entries.length && (
          <Empty title="No matches yet">
            Try a client name, event type, or phone number.
          </Empty>
        )}
      </div>
      <div className="command-footer">
        <span>↑ ↓ to navigate</span>
        <span>↵ to open</span>
        <span>{brand.name}</span>
      </div>
    </Modal>
  );
}
function Notifications({ close }: { close: () => void }) {
  const { data, mutate, toast } = useStudio();
  const navigate = useNavigate();
  return (
    <Modal
      title="Notifications"
      subtitle="A little heads-up for your studio."
      onClose={close}
      drawer
    >
      <div className="drawer-body">
        <div className="notification-toolbar">
          <span>{data.notifications.filter((n) => !n.read).length} unread</span>
          <button
            className="text-action"
            onClick={() => {
              mutate((d) => d.notifications.forEach((n) => (n.read = true)));
              toast("All notifications marked as read.");
            }}
          >
            Mark all as read
            <Check size={14} />
          </button>
        </div>
        {data.notifications.map((n) => (
          <button
            key={n.id}
            className={`notification-item ${!n.read ? "unread" : ""}`}
            onClick={() => {
              mutate(
                (d) =>
                  (d.notifications.find((x) => x.id === n.id)!.read = true),
              );
              if (n.bookingId)
                navigate(
                  `/bookings/${n.bookingId}${n.kind === "payment" ? "?tab=Payments" : ""}`,
                );
              close();
            }}
          >
            <span
              className={`attention-icon ${n.kind === "payment" ? "red" : n.kind === "project" ? "amber" : "violet"}`}
            >
              {n.kind === "payment" ? (
                <CreditCard size={18} />
              ) : n.kind === "project" ? (
                <PackageCheck size={18} />
              ) : (
                <Camera size={18} />
              )}
            </span>
            <span>
              <strong>{n.title}</strong>
              <p>{n.description}</p>
              <small>Today · Studio update</small>
            </span>
            {!n.read && <i className="unread-dot" />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
function Onboarding({ close }: { close: () => void }) {
  const { data, mutate, toast } = useStudio();
  const [step, setStep] = useState(0),
    [settings, set] = useState(data.settings),
    [error, setError] = useState("");
  const patch = (key: string, value: string | number | string[]) =>
    set((s) => ({ ...s, [key]: value }));
  const total = settings.advance + settings.beforeEvent + settings.delivery;
  return (
    <Modal
      title={
        [
          "Welcome to FrameFlow",
          "Make it your studio",
          "What do you love to shoot?",
          "A payment plan that works for you",
          "You’re all set",
        ][step]
      }
      subtitle={`Step ${step + 1} of 5 · Your studio, thoughtfully organized.`}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 3 && total !== 100) {
            setError("Your payment structure must add up to 100%.");
            return;
          }
          setError("");
          if (step === 4) {
            mutate((d) => (d.settings = { ...settings, onboarded: true }));
            toast("Welcome! Your studio is ready.");
            close();
          } else setStep((s) => s + 1);
        }}
      >
        <div className="modal-body">
          <div className="onboarding-progress">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i <= step ? "active" : ""} />
            ))}
          </div>
          {step === 0 && (
            <div className="onboarding-welcome">
              <span className="brand-symbol">
                <Aperture size={36} />
              </span>
              <h2>
                Run your photography business
                <br />
                without spreadsheets.
              </h2>
              <p>
                Your bookings, payments, and projects.
                <br />
                Together in one calm workspace.
              </p>
              <div className="onboarding-benefits">
                <span>
                  <Check size={16} />
                  Every shoot in sync
                </span>
                <span>
                  <Check size={16} />
                  Every payment in view
                </span>
              </div>
            </div>
          )}
          {step === 1 && (
            <>
              <Field label="Studio name">
                <input
                  required
                  value={settings.name}
                  onChange={(e) => patch("name", e.target.value)}
                />
              </Field>
              <Field label="Owner name">
                <input
                  required
                  value={settings.owner}
                  onChange={(e) => patch("owner", e.target.value)}
                />
              </Field>
              <div className="form-grid">
                <Field label="Phone">
                  <input
                    required
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => patch("phone", e.target.value)}
                  />
                </Field>
                <Field label="City">
                  <input
                    required
                    value={settings.city}
                    onChange={(e) => patch("city", e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}
          {step === 2 && (
            <div className="service-options">
              {[
                "Wedding",
                "Engagement",
                "Pre-wedding",
                "Portrait",
                "Corporate",
                "Events",
              ].map((s) => (
                <label
                  className={settings.services.includes(s) ? "selected" : ""}
                  key={s}
                >
                  <input
                    type="checkbox"
                    checked={settings.services.includes(s)}
                    onChange={(e) =>
                      patch(
                        "services",
                        e.target.checked
                          ? [...settings.services, s]
                          : settings.services.filter((x) => x !== s),
                      )
                    }
                  />
                  <Camera size={20} />
                  <strong>{s}</strong>
                </label>
              ))}
            </div>
          )}
          {step === 3 && (
            <>
              <p className="muted">
                New bookings will automatically get these three payment
                milestones.
              </p>
              {(["advance", "beforeEvent", "delivery"] as const).map(
                (key, i) => (
                  <Field
                    key={key}
                    label={
                      [
                        "Booking advance (%)",
                        "Before event (%)",
                        "Before delivery (%)",
                      ][i]
                    }
                  >
                    <input
                      required
                      type="number"
                      min="0"
                      max="100"
                      value={settings[key]}
                      onChange={(e) => patch(key, Number(e.target.value))}
                    />
                  </Field>
                ),
              )}
              <div className="form-summary">
                <span>Total</span>
                <strong>{total}%</strong>
              </div>
              {error && <p className="form-error">{error}</p>}
            </>
          )}
          {step === 4 && (
            <div className="onboarding-welcome">
              <span className="success-circle">
                <Check size={30} />
              </span>
              <h2>A clearer picture of your business.</h2>
              <p>
                {settings.name} is ready. Explore the seeded bookings, or create
                your first client story.
              </p>
              <Badge tone="violet">
                {settings.services.length} services · {settings.city}
              </Badge>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn"
            onClick={step ? () => setStep((s) => s - 1) : close}
          >
            {step ? "Back" : "Explore first"}
          </button>
          <button className="btn primary">
            {step === 4
              ? "Go to Dashboard"
              : step === 0
                ? "Set up my studio"
                : "Continue"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
