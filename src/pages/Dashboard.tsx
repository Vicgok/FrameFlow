import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  FolderKanban,
  Plus,
  Sparkles,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useStudio } from "../data/store";
import {
  balance,
  clientFor,
  dateLabel,
  daysUntil,
  money,
  paymentStatus,
  TODAY,
} from "../data/utils";
import { Avatar, Badge, Panel, Progress, TextAction } from "../components/ui";
import { useActions } from "../components/actions";
export function Dashboard({ setup }: { setup: () => void }) {
  const { data } = useStudio(),
    { open } = useActions(),
    navigate = useNavigate();
  const collected = data.bookings.reduce((s, b) => s + b.paidAmount, 0),
    pending = data.bookings.reduce((s, b) => s + balance(b), 0),
    overdue = data.bookings
      .filter((b) => paymentStatus(b) === "Overdue")
      .reduce((s, b) => s + balance(b), 0);
  const upcoming = data.bookings
    .filter(
      (b) =>
        b.eventDate >= TODAY &&
        ![
          "Shoot Completed",
          "Editing",
          "Ready for Delivery",
          "Completed",
          "New Enquiry",
          "Proposal Sent",
        ].includes(b.status),
    )
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const late = data.bookings.find((b) => paymentStatus(b) === "Overdue"),
    tomorrow = upcoming.find((b) => daysUntil(b.eventDate) <= 1),
    editing = data.projects
      .filter((p) => p.status === "Editing")
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const enquiries = data.bookings.filter((b) =>
    ["New Enquiry", "Proposal Sent"].includes(b.status),
  );
  return (
    <div className="dashboard page-enter">
      <div className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            YOUR STUDIO, AT A GLANCE
          </div>
          <h1>
            Good morning, {data.settings.owner.split(" ")[0]}
            <Sun className="greeting-sun" size={26} strokeWidth={1.6} />
          </h1>
          <p>Here’s what’s happening with your studio today.</p>
        </div>
        <button
          className="btn date-button"
          onClick={() => navigate("/calendar")}
        >
          <CalendarDays size={16} />
          Saturday, 10 October
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="metrics-strip">
        <button className="metric" onClick={() => navigate("/bookings")}>
          <span className="metric-label">
            Bookings this month
            <Camera size={16} />
          </span>
          <strong>
            {
              data.bookings.filter((b) => b.eventDate.startsWith("2026-10"))
                .length
            }
            <small>bookings</small>
          </strong>
          <span className="metric-foot">
            <i className="green-text">A full month of stories</i>
            <ArrowUpRight size={14} />
          </span>
        </button>
        <button
          className="metric"
          onClick={() => navigate("/payments?filter=collected")}
        >
          <span className="metric-label">
            Revenue collected
            <TrendingUp size={16} />
          </span>
          <strong>{money(collected)}</strong>
          <span className="metric-foot">
            <i className="green-text">
              <span className="tiny-dot" />
              Payments safely accounted for
            </i>
            <ArrowUpRight size={14} />
          </span>
        </button>
        <button
          className="metric"
          onClick={() => navigate("/payments?filter=pending")}
        >
          <span className="metric-label">
            Pending payments
            <CreditCard size={16} />
          </span>
          <strong>{money(pending)}</strong>
          <span className="metric-foot">
            <i>{money(overdue)} overdue</i>
            <ArrowUpRight size={14} />
          </span>
        </button>
        <button className="metric" onClick={() => navigate("/calendar")}>
          <span className="metric-label">
            Upcoming shoots
            <CalendarDays size={16} />
          </span>
          <strong>
            {upcoming.length}
            <small>shoots</small>
          </strong>
          <span className="metric-foot">
            <i>
              Next:{" "}
              {upcoming[0]
                ? dateLabel(upcoming[0].eventDate, "d MMM")
                : "All caught up"}
            </i>
            <ArrowUpRight size={14} />
          </span>
        </button>
      </div>
      <div className="dashboard-main-grid">
        <div className="dashboard-primary">
          <Panel
            title="A little attention goes a long way"
            subtitle="Your priorities, without the noise."
            action={
              <span className="count-pill">
                {Number(!!late) +
                  Number(!!tomorrow) +
                  Number(!!editing[0]) +
                  Number(!!enquiries[0])}{" "}
                to do
              </span>
            }
            className="attention-panel"
          >
            {late && (
              <div className="attention-row">
                <span className="attention-icon red">
                  <CreditCard size={19} />
                </span>
                <div>
                  <span className="attention-caption red-text">
                    PAYMENT OVERDUE
                  </span>
                  <strong>
                    {clientFor(data, late).name}
                    <span> · {late.eventType}</span>
                  </strong>
                  <p>
                    {money(balance(late))} pending · Due{" "}
                    {dateLabel(late.paymentDueDate, "d MMM")}
                  </p>
                </div>
                <button
                  className="btn small"
                  onClick={() => open({ kind: "reminder", id: late.id })}
                >
                  Send reminder
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )}
            {tomorrow && (
              <div className="attention-row">
                <span className="attention-icon violet">
                  <Camera size={19} />
                </span>
                <div>
                  <span className="attention-caption violet-text">
                    SHOOT{" "}
                    {daysUntil(tomorrow.eventDate) === 0 ? "TODAY" : "TOMORROW"}
                  </span>
                  <strong>
                    {clientFor(data, tomorrow).name}
                    <span> · {tomorrow.eventType}</span>
                  </strong>
                  <p>
                    {dateLabel(tomorrow.eventDate, "EEE, d MMM")} ·{" "}
                    {tomorrow.startTime} · {tomorrow.venue.split(",")[0]}
                  </p>
                </div>
                <button
                  className="btn small"
                  onClick={() => navigate(`/bookings/${tomorrow.id}`)}
                >
                  View booking
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )}
            {editing[0] &&
              (() => {
                const p = editing[0],
                  b = data.bookings.find((b) => b.id === p.bookingId)!;
                const done = data.deliverables.filter(
                  (d) =>
                    d.projectId === p.id &&
                    ["Approved", "Delivered"].includes(d.status),
                ).length;
                return (
                  <div className="attention-row">
                    <span className="attention-icon amber">
                      <Clock3 size={19} />
                    </span>
                    <div>
                      <span className="attention-caption amber-text">
                        EDITING DEADLINE IN {Math.max(0, daysUntil(p.deadline))}{" "}
                        DAYS
                      </span>
                      <strong>
                        {clientFor(data, b).name}
                        <span> · {b.eventType}</span>
                      </strong>
                      <p>
                        {done} /{" "}
                        {
                          data.deliverables.filter((d) => d.projectId === p.id)
                            .length
                        }{" "}
                        deliverables ready · A little closer to the finish
                      </p>
                    </div>
                    <button
                      className="btn small"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      Open project
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                );
              })()}
            {enquiries[0] && (
              <div className="attention-row">
                <span className="attention-icon blue">
                  <CircleAlert size={19} />
                </span>
                <div>
                  <span className="attention-caption blue-text">
                    CLIENT CONFIRMATION
                  </span>
                  <strong>
                    {clientFor(data, enquiries[0]).name}
                    <span> · {enquiries[0].eventType}</span>
                  </strong>
                  <p>Proposal is waiting for a little follow-up</p>
                </div>
                <button
                  className="btn small"
                  onClick={() => navigate(`/bookings/${enquiries[0].id}`)}
                >
                  Follow up
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )}
            {!late && !tomorrow && !editing.length && !enquiries.length && (
              <div className="all-clear">
                <Check size={22} />
                <strong>Room to focus on your craft.</strong>
                <p>You’re all caught up today.</p>
              </div>
            )}
          </Panel>
          <Panel
            title="Next up on your calendar"
            subtitle="The stories you’ll be capturing next."
            action={
              <TextAction onClick={() => navigate("/calendar")}>
                View calendar
              </TextAction>
            }
          >
            <div className="upcoming-list">
              <div className="upcoming-header">
                <span>SHOOT / CLIENT</span>
                <span>TEAM</span>
                <span>PAYMENT</span>
                <span />
              </div>
              {upcoming.slice(0, 5).map((b) => (
                <button
                  key={b.id}
                  className="upcoming-row"
                  onClick={() => navigate(`/bookings/${b.id}`)}
                >
                  <span className="date-tile">
                    <small>{dateLabel(b.eventDate, "MMM")}</small>
                    <strong>{dateLabel(b.eventDate, "dd")}</strong>
                  </span>
                  <span className="upcoming-client">
                    <strong>
                      {clientFor(data, b).name}
                      <Badge tone="neutral">{b.eventType}</Badge>
                    </strong>
                    <small>
                      {b.venue}
                      <span> · </span>
                      {b.startTime}
                    </small>
                  </span>
                  <span className="avatar-stack">
                    {b.assignedMembers.slice(0, 2).map((id) => {
                      const member = data.team.find((t) => t.id === id)!;
                      return (
                        <Avatar
                          small
                          key={id}
                          name={member.name}
                          color={member.color}
                        />
                      );
                    })}
                    {b.assignedMembers.length > 2 && (
                      <span className="more-avatar">
                        +{b.assignedMembers.length - 2}
                      </span>
                    )}
                  </span>
                  <span
                    className={`upcoming-payment ${!balance(b) ? "green-text" : ""}`}
                  >
                    <i
                      className={`tiny-dot ${!balance(b) ? "green" : "amber"}`}
                    />
                    {!balance(b)
                      ? "Fully paid"
                      : `${Math.round((b.paidAmount / b.totalAmount) * 100)}% paid`}
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
            {!upcoming.length && (
              <div className="all-clear">
                No upcoming shoots. A new story is just a booking away.
              </div>
            )}
          </Panel>
        </div>
        <div className="dashboard-secondary">
          <Panel
            title="Your week, in focus"
            action={
              <button
                className="icon-button"
                aria-label="Open calendar"
                onClick={() => navigate("/calendar")}
              >
                <CalendarDays size={17} />
              </button>
            }
            className="week-panel"
          >
            <div className="week-dates">
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <button
                  onClick={() =>
                    navigate(
                      `/calendar?date=2026-10-${String(5 + i).padStart(2, "0")}`,
                    )
                  }
                  key={i}
                  className={i === 5 ? "today" : i === 6 ? "has-shoot" : ""}
                >
                  <span>{d}</span>
                  <strong>{5 + i}</strong>
                  <i />
                </button>
              ))}
            </div>
            <div className="week-agenda">
              <div className="agenda-label">TOMORROW, 11 OCT</div>
              {tomorrow ? (
                <button
                  className="agenda-event"
                  onClick={() => navigate(`/bookings/${tomorrow.id}`)}
                >
                  <span className="agenda-time">
                    07:00<span>AM</span>
                  </span>
                  <div>
                    <Badge tone="violet">Wedding shoot</Badge>
                    <strong>{clientFor(data, tomorrow).name}</strong>
                    <p>{tomorrow.venue.split(",")[0]}</p>
                    <div className="agenda-team">
                      <Avatar name="Arjun Kumar" small />
                      <span>Arjun + 2 team members</span>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="quiet-day">
                  No shoots tomorrow.
                  <br />A little breathing room.
                </div>
              )}
              <button
                className="week-calendar-link"
                onClick={() => navigate("/calendar")}
              >
                Open full calendar
                <ArrowRight size={15} />
              </button>
            </div>
          </Panel>
          <Panel
            title="Your money, clearly"
            subtitle="Every rupee accounted for."
            action={
              <button
                className="icon-button"
                aria-label="Open payments"
                onClick={() => navigate("/payments")}
              >
                <ArrowUpRight size={18} />
              </button>
            }
            className="revenue-panel"
          >
            <div className="revenue-total">
              <small>TOTAL BOOKING VALUE</small>
              <strong>{money(collected + pending)}</strong>
            </div>
            <button
              className="revenue-bar"
              aria-label="View payment breakdown"
              onClick={() => navigate("/payments")}
            >
              <span
                style={{
                  width: `${(collected / (collected + pending || 1)) * 100}%`,
                }}
              />
              <span
                style={{
                  width: `${((pending - overdue) / (collected + pending || 1)) * 100}%`,
                }}
              />
              <span
                style={{
                  width: `${(overdue / (collected + pending || 1)) * 100}%`,
                }}
              />
            </button>
            <div className="revenue-legend">
              {[
                ["Collected", collected, "violet"],
                ["Pending", pending - overdue, "amber"],
                ["Overdue", overdue, "red"],
              ].map(([label, value, color]) => (
                <button
                  key={String(label)}
                  onClick={() =>
                    navigate(`/payments?filter=${String(label).toLowerCase()}`)
                  }
                >
                  <span>
                    <i className={`tiny-dot ${color}`} />
                    {label}
                  </span>
                  <strong>{money(Number(value))}</strong>
                </button>
              ))}
            </div>
            <div className="revenue-note">
              <CreditCard size={15} />
              Payments update across your workspace.
            </div>
          </Panel>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Behind the scenes</h2>
          <p>From the last shutter click to the final handoff.</p>
        </div>
        <TextAction onClick={() => navigate("/projects")}>
          All projects
        </TextAction>
      </div>
      <div className="dashboard-projects">
        {editing.slice(0, 2).map((p, i) => {
          const b = data.bookings.find((b) => b.id === p.bookingId)!;
          const progress = p.completedStages.length * 10;
          return (
            <button
              className="mini-project"
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div className={`project-art art-${i}`}>
                <Camera size={24} strokeWidth={1.2} />
                <span>{b.eventType.toUpperCase()}</span>
              </div>
              <div className="mini-project-info">
                <div>
                  <strong>{clientFor(data, b).name}</strong>
                  <Badge>Editing</Badge>
                </div>
                <small>
                  {b.eventType} · Due {dateLabel(p.deadline, "d MMM")}
                </small>
                <div className="mini-progress">
                  <Progress value={progress} />
                  <span>{progress}%</span>
                </div>
              </div>
              <ChevronRight size={18} />
            </button>
          );
        })}
        <div className="workspace-tip">
          <Sparkles size={20} />
          <div>
            <strong>
              {data.settings.onboarded
                ? "A workflow that stays with you."
                : "Make yourself at home."}
            </strong>
            <p>
              {data.settings.onboarded
                ? "Client requests travel with each project, right through delivery."
                : "Add your studio details and choose your default payment plan."}
            </p>
            <button
              onClick={
                data.settings.onboarded ? () => navigate("/projects") : setup
              }
            >
              {data.settings.onboarded
                ? "Explore projects"
                : "Personalize your studio"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
