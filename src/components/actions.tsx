import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { addDays, format, parseISO } from "../data/dates";
import {
  ArrowRight,
  Check,
  CalendarDays,
  CircleAlert,
  Copy,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { useStudio } from "../data/store";
import {
  balance,
  clientFor,
  dateLabel,
  money,
  TODAY,
  uid,
} from "../data/utils";
import {
  BOOKING_STATUSES,
  DELIVERABLE_STATUSES,
  EVENT_TYPES,
  type BookingInput,
} from "../data/types";
import { Badge, Field, Modal } from "./ui";
type Overlay =
  | { kind: "booking"; date?: string; id?: string }
  | { kind: "payment" | "reminder" | "deliverable"; id: string }
  | { kind: "block"; start: string; end?: string }
  | { kind: "new-deliverable"; id: string }
  | null;
const Actions = createContext<{ open: (value: Overlay) => void } | null>(null);
export const useActions = () => useContext(Actions)!;
export function ActionProvider({ children }: { children: ReactNode }) {
  const [overlay, open] = useState<Overlay>(null);
  const close = () => open(null);
  return (
    <Actions.Provider value={{ open }}>
      {children}
      {overlay?.kind === "booking" && (
        <BookingForm
          key={overlay.id || overlay.date || "new"}
          date={overlay.date}
          id={overlay.id}
          close={close}
        />
      )}
      {overlay?.kind === "payment" && (
        <PaymentForm id={overlay.id} close={close} />
      )}
      {overlay?.kind === "reminder" && (
        <Reminder id={overlay.id} close={close} />
      )}
      {overlay?.kind === "block" && (
        <BlockForm start={overlay.start} end={overlay.end} close={close} />
      )}
      {overlay?.kind === "deliverable" && (
        <DeliverableForm id={overlay.id} close={close} />
      )}
      {overlay?.kind === "new-deliverable" && (
        <NewDeliverable projectId={overlay.id} close={close} />
      )}
    </Actions.Provider>
  );
}
function BookingForm({
  date,
  id,
  close,
}: {
  date?: string;
  id?: string;
  close: () => void;
}) {
  const { data, addBooking, conflicts, mutate, toast, addActivity } =
    useStudio();
  const navigate = useNavigate();
  const existing = data.bookings.find((b) => b.id === id),
    client = existing && clientFor(data, existing);
  const [input, set] = useState<BookingInput>({
    clientName: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    eventType: existing?.eventType || "Wedding",
    eventDate: existing?.eventDate || date || "2026-10-14",
    startTime: existing?.startTime || "07:00",
    endTime: existing?.endTime || "15:00",
    venue: existing?.venue || "",
    packageName: existing?.packageName || "Premium Wedding",
    totalAmount: existing?.totalAmount || 85000,
    advance: existing?.paidAmount || 0,
    paymentDueDate: existing?.paymentDueDate || "2026-10-12",
    memberId: existing?.assignedMembers[0] || data.team[0].id,
    notes: existing?.notes || "",
  });
  const [collision, setCollision] = useState<ReturnType<
    typeof conflicts
  > | null>(null);
  const [error, setError] = useState("");
  const patch = (key: keyof BookingInput, value: string | number) =>
    set((v) => ({ ...v, [key]: value }));
  function save(override = false) {
    setError("");
    if (input.endTime <= input.startTime)
      return setError("End time must be after start time.");
    if (
      input.totalAmount <= 0 ||
      input.advance < 0 ||
      input.advance > input.totalAmount
    )
      return setError(
        "Enter a positive booking amount and an advance within that amount.",
      );
    if (existing && input.totalAmount < existing.paidAmount)
      return setError(
        "The booking amount cannot be lower than payments already received.",
      );
    const found = conflicts(input, id);
    if (found.length && !override) {
      setCollision(found);
      return;
    }
    if (existing) {
      mutate((d) => {
        const b = d.bookings.find((b) => b.id === id)!;
        const c = d.clients.find((c) => c.id === b.clientId)!;
        Object.assign(c, {
          name: input.clientName,
          phone: input.phone,
          email: input.email,
        });
        Object.assign(b, {
          eventType: input.eventType,
          eventDate: input.eventDate,
          startTime: input.startTime,
          endTime: input.endTime,
          venue: input.venue,
          packageName: input.packageName,
          totalAmount: input.totalAmount,
          paymentDueDate: input.paymentDueDate,
          assignedMembers: [input.memberId],
          notes: input.notes,
        });
        const milestones = d.milestones.filter((m) => m.bookingId === b.id);
        let remaining = b.paidAmount;
        milestones.forEach((m, i) => {
          m.amount =
            i === 0
              ? Math.round((b.totalAmount * d.settings.advance) / 100)
              : i === 1
                ? Math.round((b.totalAmount * d.settings.beforeEvent) / 100)
                : b.totalAmount - milestones[0].amount - milestones[1].amount;
          m.paidAmount = Math.min(remaining, m.amount);
          remaining -= m.paidAmount;
          if (i === 1) m.dueDate = b.paymentDueDate;
        });
      });
      addActivity(id!, "Booking details updated");
      toast("Booking updated. Calendar and payment schedule synced.");
      close();
    } else {
      const newId = addBooking(input);
      close();
      navigate(`/bookings/${newId}`);
    }
  }
  return (
    <Modal
      title={id ? "Edit booking" : "A new story starts here"}
      subtitle={
        id
          ? "Update the details. Your workspace stays in sync."
          : "One booking. Every detail in the right place."
      }
      onClose={close}
      drawer
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="drawer-body">
          <div className="form-section">
            <h3>CLIENT DETAILS</h3>
            <Field label="Client name">
              <input
                required
                autoComplete="name"
                placeholder="e.g. Vignesh & Karthiga"
                value={input.clientName}
                onChange={(e) => patch("clientName", e.target.value)}
              />
            </Field>
            <div className="form-grid">
              <Field label="Phone number">
                <input
                  required
                  type="tel"
                  minLength={10}
                  placeholder="+91 98401 23456"
                  value={input.phone}
                  onChange={(e) => patch("phone", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={input.email}
                  onChange={(e) => patch("email", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <div className="form-section">
            <h3>THE SHOOT</h3>
            <div className="form-grid">
              <Field label="Event type">
                <select
                  value={input.eventType}
                  onChange={(e) => patch("eventType", e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Event date">
                <input
                  required
                  type="date"
                  value={input.eventDate}
                  onChange={(e) => patch("eventDate", e.target.value)}
                />
              </Field>
              <Field label="Start time">
                <input
                  required
                  type="time"
                  value={input.startTime}
                  onChange={(e) => patch("startTime", e.target.value)}
                />
              </Field>
              <Field label="End time">
                <input
                  required
                  type="time"
                  value={input.endTime}
                  onChange={(e) => patch("endTime", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Venue / location">
              <input
                required
                placeholder="Venue name, city"
                value={input.venue}
                onChange={(e) => patch("venue", e.target.value)}
              />
            </Field>
            <Field label="Package">
              <input
                required
                value={input.packageName}
                onChange={(e) => patch("packageName", e.target.value)}
              />
            </Field>
          </div>
          <div className="form-section">
            <h3>PAYMENTS & TEAM</h3>
            <div className="form-grid">
              <Field label="Booking amount (₹)">
                <input
                  required
                  type="number"
                  min="1"
                  value={input.totalAmount}
                  onChange={(e) => patch("totalAmount", Number(e.target.value))}
                />
              </Field>
              <Field
                label={
                  existing ? "Payments received (₹)" : "Advance received (₹)"
                }
                hint={
                  existing ? "Use Record Payment to add receipts." : undefined
                }
              >
                <input
                  required
                  disabled={!!existing}
                  type="number"
                  min="0"
                  max={input.totalAmount}
                  value={input.advance}
                  onChange={(e) => patch("advance", Number(e.target.value))}
                />
              </Field>
              <Field label="Payment due date">
                <input
                  required
                  type="date"
                  value={input.paymentDueDate}
                  onChange={(e) => patch("paymentDueDate", e.target.value)}
                />
              </Field>
              <Field label="Assigned photographer">
                <select
                  value={input.memberId}
                  onChange={(e) => patch("memberId", e.target.value)}
                >
                  {data.team.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                rows={3}
                placeholder="Anything we should know about this shoot?"
                value={input.notes}
                onChange={(e) => patch("notes", e.target.value)}
              />
            </Field>
            <div className="form-summary">
              <span>Remaining balance</span>
              <strong>{money(input.totalAmount - input.advance)}</strong>
            </div>
            <div className="inline-info">
              <Sparkles size={17} />
              {id
                ? "Calendar and payment milestones update automatically."
                : "We’ll create the client, reserve your calendar, and set up a project automatically."}
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {collision && (
            <div className="conflict" role="alert">
              <h3>
                <CircleAlert size={18} />
                Schedule conflict
              </h3>
              <p>
                You already have a booking or unavailable block during this
                period.
              </p>
              {collision.map((c, i) => (
                <div className="conflict-item" key={i}>
                  <strong>{c.title}</strong>
                  <small>{c.detail}</small>
                </div>
              ))}
              <div className="button-row">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setCollision(null)}
                >
                  Cancel override
                </button>
                <button
                  type="button"
                  className="btn warning"
                  onClick={() => save(true)}
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" type="submit">
            {id ? "Save changes" : "Create Booking"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function PaymentForm({ id, close }: { id: string; close: () => void }) {
  const { data, recordPayment } = useStudio();
  const b = data.bookings.find((b) => b.id === id)!;
  const [amount, setAmount] = useState(balance(b)),
    [date, setDate] = useState(TODAY),
    [method, setMethod] = useState("UPI"),
    [reference, setReference] = useState(""),
    [notes, setNotes] = useState("");
  return (
    <Modal
      title="Record a payment"
      subtitle={`${clientFor(data, b).name} · ${b.eventType}`}
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            recordPayment({
              bookingId: id,
              amount,
              date,
              method,
              reference,
              notes,
            })
          )
            close();
        }}
      >
        <div className="modal-body">
          <div className="payment-balance">
            <span>Outstanding balance</span>
            <strong>{money(balance(b))}</strong>
            <small>of {money(b.totalAmount)} total booking value</small>
          </div>
          <Field label="Amount received (₹)">
            <input
              required
              type="number"
              min="1"
              max={balance(b)}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
          <div className="form-grid">
            <Field label="Payment date">
              <input
                required
                type="date"
                max={TODAY}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Payment method">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {["UPI", "Bank Transfer", "Cash", "Card", "Other"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Reference / transaction ID">
            <input
              placeholder="Optional"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <textarea
              rows={2}
              placeholder="Optional payment details"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={close}>
            Cancel
          </button>
          <button className="btn primary" disabled={!balance(b)}>
            Record {money(amount)} Payment
            <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Reminder({ id, close }: { id: string; close: () => void }) {
  const { data, toast, addActivity } = useStudio();
  const b = data.bookings.find((b) => b.id === id)!;
  const c = clientFor(data, b);
  const [message, setMessage] = useState(
    `Hi ${c.name.split(" ")[0]},\n\nA quick reminder that ${money(balance(b))} is pending for your ${b.eventType.toLowerCase()} photography booking scheduled for ${dateLabel(b.eventDate, "d MMMM")}.\n\nPlease let us know once the payment is made. Looking forward to capturing your special day!\n\n${data.settings.name}`,
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast("Reminder copied to clipboard.");
      addActivity(id, "Payment reminder copied", "payment");
    } catch {
      toast("Select the message and copy it with Ctrl/Cmd + C.");
    }
  }
  return (
    <Modal
      title="A friendly payment reminder"
      subtitle="Personalize it before sharing with your client."
      onClose={close}
    >
      <div className="modal-body">
        <div className="reminder-preview">
          <div>
            <MessageCircle size={18} />
            <strong>{c.name}</strong>
            <span>Message preview</span>
          </div>
          <textarea
            aria-label="Reminder message"
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <p className="muted small-text">
          Prototype preview · no message will be sent automatically.
        </p>
      </div>
      <div className="modal-footer">
        <button className="btn" onClick={copy}>
          <Copy size={16} />
          Copy message
        </button>
        <button
          className="btn primary"
          onClick={() => {
            addActivity(id, "WhatsApp reminder prepared", "payment");
            toast("WhatsApp preview opened. Reminder ready to share.");
            close();
          }}
        >
          <Send size={16} />
          Open WhatsApp
        </button>
      </div>
    </Modal>
  );
}
function BlockForm({
  start,
  end,
  close,
}: {
  start: string;
  end?: string;
  close: () => void;
}) {
  const { addBlock } = useStudio();
  const initialAllDay = !start.includes("T");
  const [reason, setReason] = useState("Personal"),
    [note, setNote] = useState(""),
    [allDay, setAllDay] = useState(initialAllDay),
    [from, setFrom] = useState(start.includes("T") ? start : start + "T09:00"),
    [to, setTo] = useState(
      end
        ? end.includes("T")
          ? end
          : end + "T18:00"
        : start.slice(0, 10) + "T18:00",
    ),
    [repeat, setRepeat] = useState("Does not repeat"),
    [error, setError] = useState("");
  return (
    <Modal
      title="Make room for yourself"
      subtitle="Block time so your availability stays accurate."
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const a = allDay ? from.slice(0, 10) + "T00:00" : from;
          const z = allDay
            ? format(
                addDays(parseISO(to.slice(0, 10)), 1),
                "yyyy-MM-dd'T'00:00",
              )
            : to;
          if (z <= a) return setError("End must be after the start.");
          addBlock({
            reason: `${reason}${note ? " · " + note : ""}`,
            start: a,
            end: z,
            allDay,
            repeat,
          });
          close();
        }}
      >
        <div className="modal-body">
          <div className="inline-info">
            <CalendarDays size={18} />
            These slots will show as unavailable for new bookings.
          </div>
          <Field label="Reason">
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {["Personal", "Unavailable", "Travel", "Editing", "Other"].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Description">
            <input
              placeholder="e.g. family time, travel to location"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <label className="check-row">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All-day block
          </label>
          <div className="form-grid">
            <Field label="Start">
              <input
                required
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? from.slice(0, 10) : from}
                onChange={(e) =>
                  setFrom(allDay ? e.target.value + "T09:00" : e.target.value)
                }
              />
            </Field>
            <Field label="End">
              <input
                required
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? to.slice(0, 10) : to}
                onChange={(e) =>
                  setTo(allDay ? e.target.value + "T18:00" : e.target.value)
                }
              />
            </Field>
          </div>
          <Field label="Repeat">
            <select value={repeat} onChange={(e) => setRepeat(e.target.value)}>
              {["Does not repeat", "Weekly", "Monthly"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={close}>
            Cancel
          </button>
          <button className="btn primary">Block Time</button>
        </div>
      </form>
    </Modal>
  );
}
function DeliverableForm({ id, close }: { id: string; close: () => void }) {
  const { data, updateDeliverable, toast } = useStudio();
  const original = data.deliverables.find((d) => d.id === id)!;
  const [item, setItem] = useState(structuredClone(original));
  return (
    <Modal
      title={item.title}
      subtitle="Client expectations, kept close to the work."
      onClose={close}
      drawer
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateDeliverable(id, item);
          toast("Deliverable saved. Your project is up to date.");
          close();
        }}
      >
        <div className="drawer-body">
          <Badge>{item.status}</Badge>
          <div className="form-grid section-gap">
            <Field label="Status">
              <select
                value={item.status}
                onChange={(e) =>
                  setItem((x) => ({
                    ...x,
                    status: e.target.value as typeof x.status,
                  }))
                }
              >
                {DELIVERABLE_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Assigned to">
              <select
                value={item.assigneeId}
                onChange={(e) =>
                  setItem((x) => ({ ...x, assigneeId: e.target.value }))
                }
              >
                {data.team.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.role}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Deadline">
            <input
              required
              type="date"
              value={item.dueDate}
              onChange={(e) =>
                setItem((x) => ({ ...x, dueDate: e.target.value }))
              }
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              value={item.description}
              onChange={(e) =>
                setItem((x) => ({ ...x, description: e.target.value }))
              }
            />
          </Field>
          <Field label="Client requested notes">
            <textarea
              rows={3}
              placeholder="What matters most to your client?"
              value={item.clientNotes}
              onChange={(e) =>
                setItem((x) => ({ ...x, clientNotes: e.target.value }))
              }
            />
          </Field>
          <Field label="Internal notes">
            <textarea
              rows={3}
              placeholder="Notes for your editing team"
              value={item.internalNotes}
              onChange={(e) =>
                setItem((x) => ({ ...x, internalNotes: e.target.value }))
              }
            />
          </Field>
          <h3 className="section-title">Quality checklist</h3>
          {item.checklist.map((check) => (
            <label key={check.id} className="check-row">
              <input
                type="checkbox"
                checked={check.done}
                onChange={(e) =>
                  setItem((x) => ({
                    ...x,
                    checklist: x.checklist.map((c) =>
                      c.id === check.id ? { ...c, done: e.target.checked } : c,
                    ),
                  }))
                }
              />
              {check.title}
            </label>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={close}>
            Cancel
          </button>
          <button className="btn primary">Save deliverable</button>
        </div>
      </form>
    </Modal>
  );
}
function NewDeliverable({
  projectId,
  close,
}: {
  projectId: string;
  close: () => void;
}) {
  const { data, mutate, addActivity, toast } = useStudio();
  const project = data.projects.find((p) => p.id === projectId)!;
  const [title, setTitle] = useState(""),
    [date, setDate] = useState(project.deadline),
    [member, setMember] = useState(project.editorId);
  return (
    <Modal
      title="Add a deliverable"
      subtitle="Make the expected handoff clear from the start."
      onClose={close}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutate((d) => {
            d.deliverables.push({
              id: uid(),
              projectId,
              title: title.trim(),
              description: "",
              status: "Not Started",
              assigneeId: member,
              dueDate: date,
              clientNotes: "",
              internalNotes: "",
              checklist: [],
            });
            d.notifications.unshift({
              id: uid(),
              title: "New deliverable added",
              description: title.trim(),
              bookingId: project.bookingId,
              read: false,
              kind: "project",
            });
          });
          addActivity(
            project.bookingId,
            `Deliverable added · ${title}`,
            "project",
          );
          toast("Deliverable added to the project.");
          close();
        }}
      >
        <div className="modal-body">
          <Field label="Deliverable name">
            <input
              required
              pattern=".*\S.*"
              placeholder="e.g. 30-second Instagram teaser"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Assigned to">
            <select value={member} onChange={(e) => setMember(e.target.value)}>
              {data.team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={close}>
            Cancel
          </button>
          <button className="btn primary">
            <Plus size={16} />
            Add Deliverable
          </button>
        </div>
      </form>
    </Modal>
  );
}
