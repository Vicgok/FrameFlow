import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  Edit3,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  Save,
  Send,
  User,
} from "lucide-react";
import { useStudio } from "../data/store";
import { balance, clientFor, dateLabel, money } from "../data/utils";
import { BOOKING_STATUSES, type BookingStatus } from "../data/types";
import { Avatar, Badge, Empty, Field, Modal, Panel } from "../components/ui";
import {
  ActivityTimeline,
  ClientRequests,
  DeliverableList,
  PaymentSchedule,
  PaymentSummary,
} from "../components/workflow";
import { useActions } from "../components/actions";
export function BookingDetail() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  const { data, updateStatus, mutate, addActivity, toast } = useStudio(),
    { open } = useActions();
  const [more, setMore] = useState(false),
    [messaging, setMessaging] = useState(false),
    [message, setMessage] = useState(""),
    [note, setNote] = useState("");
  const b = data.bookings.find((b) => b.id === id);
  const tab = params.get("tab") || "Overview";
  if (!b)
    return (
      <Empty
        title="Booking not found"
        action={
          <button className="btn" onClick={() => navigate("/bookings")}>
            All bookings
          </button>
        }
      />
    );
  const c = clientFor(data, b),
    project = data.projects.find((p) => p.bookingId === b.id)!;
  const current = BOOKING_STATUSES.indexOf(b.status);
  return (
    <div className="page-enter">
      <button className="back-link" onClick={() => navigate("/bookings")}>
        <ArrowLeft size={15} />
        All bookings
      </button>
      <div className="page-heading detail-heading">
        <div>
          <div className="eyebrow">{b.eventType.toUpperCase()} PHOTOGRAPHY</div>
          <h1>
            {c.name}
            <Badge>{b.status}</Badge>
          </h1>
          <p className="detail-meta">
            <span>
              <CalendarDays size={15} />
              {dateLabel(b.eventDate, "d MMMM yyyy")} · {b.startTime}–
              {b.endTime}
            </span>
            <span>
              <MapPin size={15} />
              {b.venue}
            </span>
          </p>
        </div>
        <div className="button-row detail-actions">
          <button
            className="btn"
            onClick={() => open({ kind: "booking", id: b.id })}
          >
            <Edit3 size={15} />
            Edit
          </button>
          <button
            className="btn"
            onClick={() => {
              setMessage(
                `Hi ${c.name.split(" ")[0]}, looking forward to your ${b.eventType.toLowerCase()} shoot on ${dateLabel(b.eventDate, "d MMMM")}!`,
              );
              setMessaging(true);
            }}
          >
            <MessageCircle size={15} />
            Message Client
          </button>
          {balance(b) > 0 && (
            <button
              className="btn primary"
              onClick={() => open({ kind: "payment", id: b.id })}
            >
              <Plus size={16} />
              Add Payment
            </button>
          )}
          <div className="dropdown-wrap">
            <button
              className="icon-button bordered"
              aria-label="More booking actions"
              onClick={() => setMore(!more)}
            >
              <MoreHorizontal size={20} />
            </button>
            {more && (
              <div className="dropdown-menu">
                <button
                  onClick={() => {
                    navigate(`/projects/${project.id}`);
                    setMore(false);
                  }}
                >
                  Open project
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast("Booking link copied.");
                    } catch {
                      toast("Copy the booking URL from your address bar.");
                    }
                    setMore(false);
                  }}
                >
                  Copy booking link
                </button>
                <button
                  onClick={() => {
                    navigate(`/clients/${c.id}`);
                    setMore(false);
                  }}
                >
                  Open client profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="detail-tabs">
        {["Overview", "Payments", "Timeline", "Deliverables", "Notes"].map(
          (t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setParams(t === "Overview" ? {} : { tab: t })}
            >
              {t}
              {t === "Deliverables" && (
                <small>
                  {
                    data.deliverables.filter((d) => d.projectId === project.id)
                      .length
                  }
                </small>
              )}
            </button>
          ),
        )}
      </div>
      {tab === "Overview" && (
        <>
          <Panel
            title="The client journey"
            subtitle="One connected story, from enquiry to delivery."
            action={
              <div className="status-control">
                <span>Move to</span>
                <select
                  aria-label="Booking status"
                  value={b.status}
                  onChange={(e) =>
                    updateStatus(b.id, e.target.value as BookingStatus)
                  }
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            }
            className="journey-panel"
          >
            <div className="journey-track">
              {[
                "Enquiry",
                "Proposal sent",
                "Advance paid",
                "Confirmed",
                "Shoot completed",
                "Editing",
                "Ready for delivery",
                "Delivered",
              ].map((step, i) => (
                <div
                  key={step}
                  className={`journey-step ${i < current ? "done" : ""} ${i === current ? "current" : ""}`}
                >
                  <span>{i < current ? <Check size={14} /> : i + 1}</span>
                  <strong>{step}</strong>
                  <small>
                    {i === current
                      ? "You are here"
                      : i < current
                        ? "Complete"
                        : "Coming up"}
                  </small>
                </div>
              ))}
            </div>
          </Panel>
          <div className="workspace-columns booking-overview">
            <div>
              <PaymentSummary booking={b} />
              <Panel
                title="Shoot details"
                action={
                  <button
                    className="text-action"
                    onClick={() => open({ kind: "booking", id: b.id })}
                  >
                    Edit details
                    <Edit3 size={14} />
                  </button>
                }
              >
                <div className="shoot-details-grid">
                  <div>
                    <span>EVENT</span>
                    <strong>{b.eventType} Photography</strong>
                    <small>{dateLabel(b.eventDate, "EEEE, d MMMM yyyy")}</small>
                  </div>
                  <div>
                    <span>VENUE</span>
                    <strong>{b.venue}</strong>
                    <small>
                      {b.startTime}–{b.endTime}
                    </small>
                  </div>
                  <div>
                    <span>PACKAGE</span>
                    <strong>{b.packageName}</strong>
                    <small>{money(b.totalAmount)} total value</small>
                  </div>
                  <div>
                    <span>TEAM</span>
                    <div className="team-inline">
                      {b.assignedMembers.map((id) => {
                        const t = data.team.find((t) => t.id === id)!;
                        return (
                          <span key={id} title={t.name}>
                            <Avatar name={t.name} small color={t.color} />
                            {t.name.split(" ")[0]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {b.notes && (
                  <div className="shoot-note">
                    <strong>Good to know</strong>
                    <p>{b.notes}</p>
                  </div>
                )}
              </Panel>
              <PaymentSchedule booking={b} />
            </div>
            <div>
              <Panel
                title="Your client"
                action={
                  <button
                    className="icon-button"
                    aria-label="Open client profile"
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    <ArrowRight size={16} />
                  </button>
                }
              >
                <div className="client-contact">
                  <Avatar name={c.name} />
                  <h3>{c.name}</h3>
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`}>
                    <Phone size={15} />
                    {c.phone}
                  </a>
                  <a href={`mailto:${c.email}`}>
                    <Mail size={15} />
                    {c.email || "No email added"}
                  </a>
                  <span>
                    <MapPin size={15} />
                    {c.city}
                  </span>
                  <button
                    className="btn"
                    onClick={() => navigate(`/clients/${c.id}`)}
                  >
                    View client profile
                    <ArrowRight size={15} />
                  </button>
                </div>
              </Panel>
              <Panel title="Next milestone">
                <div className="next-milestone">
                  <span className="attention-icon violet">
                    <Camera size={20} />
                  </span>
                  <div>
                    <strong>
                      {project.status === "Upcoming"
                        ? "The wedding day is getting closer."
                        : project.status === "Delivered"
                          ? "A story, delivered."
                          : "Bring the story to life."}
                    </strong>
                    <p>
                      {project.status === "Upcoming"
                        ? `${dateLabel(b.eventDate, "d MMM")} · ${b.startTime} · ${b.venue.split(",")[0]}`
                        : `Delivery deadline ${dateLabel(project.deadline)}`}
                    </p>
                    <Badge>{project.status}</Badge>
                    <button
                      className="text-action"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Open editing workspace
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </Panel>
              <ClientRequests projectId={project.id} />
            </div>
          </div>
        </>
      )}
      {tab === "Payments" && (
        <div className="workspace-columns">
          <div>
            <PaymentSummary booking={b} />
            <PaymentSchedule booking={b} />
            <Panel
              title="Payment history"
              subtitle="A reliable trail for every transaction."
            >
              <div className="payment-history">
                {data.payments
                  .filter((p) => p.bookingId === b.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((p) => (
                    <div className="receipt-row" key={p.id}>
                      <span className="attention-icon green">
                        <CreditCard size={17} />
                      </span>
                      <div>
                        <strong>{p.method}</strong>
                        <small>
                          {dateLabel(p.date)} · {p.reference || "No reference"}
                        </small>
                        {p.notes && <small>{p.notes}</small>}
                      </div>
                      <strong>{money(p.amount)}</strong>
                    </div>
                  ))}
              </div>
            </Panel>
          </div>
          <div>
            <Panel title="Follow up, thoughtfully">
              <div className="handoff-card">
                <MessageCircle size={28} />
                <h3>A friendly nudge goes a long way.</h3>
                <p>
                  {balance(b)
                    ? `${money(balance(b))} is still pending. Prepare a personal reminder for your client.`
                    : "All payments are received. The books look good."}
                </p>
                {balance(b) > 0 && (
                  <button
                    className="btn"
                    onClick={() => open({ kind: "reminder", id: b.id })}
                  >
                    <Send size={15} />
                    Send Reminder
                  </button>
                )}
              </div>
            </Panel>
          </div>
        </div>
      )}
      {tab === "Timeline" && (
        <Panel
          title="Activity timeline"
          subtitle="Every update, automatically recorded."
        >
          <ActivityTimeline bookingId={b.id} />
        </Panel>
      )}
      {tab === "Deliverables" && (
        <div className="workspace-columns">
          <div>
            <DeliverableList projectId={project.id} />
            <div className="financial-callout">
              <span className="attention-icon violet">
                <Camera size={20} />
              </span>
              <div>
                <strong>All the editing details, in one workspace.</strong>
                <p>
                  Stages, deadlines, and assignments stay linked to this
                  booking.
                </p>
              </div>
              <button
                className="btn"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                Open project
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <ClientRequests projectId={project.id} />
        </div>
      )}
      {tab === "Notes" && (
        <div className="workspace-columns">
          <Panel
            title="Booking notes"
            subtitle="Keep the context that helps your team do their best work."
          >
            <form
              className="notes-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                mutate((d) => {
                  const booking = d.bookings.find((x) => x.id === b.id)!;
                  booking.notes = `${booking.notes}${booking.notes ? "\n\n" : ""}${note.trim()}`;
                });
                addActivity(b.id, `Note added · ${note.trim()}`, "note");
                setNote("");
                toast("Note saved to booking.");
              }}
            >
              <div className="existing-notes">
                {b.notes ||
                  "No notes yet. Add the details you want your team to remember."}
              </div>
              <Field label="Add a note">
                <textarea
                  required
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Helpful context, venue logistics, or client preferences..."
                />
              </Field>
              <button className="btn primary">
                <Save size={15} />
                Save note
              </button>
            </form>
          </Panel>
          <ClientRequests projectId={project.id} />
        </div>
      )}
      {messaging && (
        <Modal
          title="Message your client"
          subtitle={`${c.name} · ${c.phone}`}
          onClose={() => setMessaging(false)}
        >
          <div className="modal-body">
            <Field label="Message">
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Field>
            <p className="muted small-text">
              Preview only. Sending through WhatsApp is a future integration.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  toast("Message copied.");
                } catch {
                  toast("Select and copy the message with Ctrl/Cmd + C.");
                }
              }}
            >
              Copy message
            </button>
            <button
              className="btn primary"
              onClick={() => {
                addActivity(b.id, "Client message prepared", "note");
                toast("Client message prepared in WhatsApp preview.");
                setMessaging(false);
              }}
            >
              <MessageCircle size={16} />
              Open WhatsApp
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
