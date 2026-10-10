import { useState } from "react";
import {
  Check,
  Circle,
  CreditCard,
  MessageSquare,
  Plus,
  ArrowUpRight,
  CalendarDays,
  PackageCheck,
} from "lucide-react";
import { useStudio } from "../data/store";
import {
  balance,
  dateLabel,
  money,
  paidPercent,
  paymentStatus,
  uid,
} from "../data/utils";
import type { Booking } from "../data/types";
import { Badge, Empty, Panel, Progress, Avatar } from "./ui";
import { useActions } from "./actions";
export function PaymentSummary({ booking: b }: { booking: Booking }) {
  const { open } = useActions();
  return (
    <Panel title="Payment overview" action={<Badge>{paymentStatus(b)}</Badge>}>
      <div className="payment-summary-numbers">
        <div>
          <span>Total value</span>
          <strong>{money(b.totalAmount)}</strong>
        </div>
        <div>
          <span>Collected</span>
          <strong className="green-text">{money(b.paidAmount)}</strong>
        </div>
        <div>
          <span>Remaining</span>
          <strong>{money(balance(b))}</strong>
        </div>
      </div>
      <div className="payment-summary-progress">
        <Progress
          value={paidPercent(b)}
          tone={!balance(b) ? "green" : "violet"}
        />
        <span>{paidPercent(b)}% paid</span>
      </div>
      <div className="payment-summary-footer">
        <span>
          <CalendarDays size={14} />
          {balance(b)
            ? `Next payment due ${dateLabel(b.paymentDueDate)}`
            : "All payments received. Thank you!"}
        </span>
        {balance(b) > 0 && (
          <button
            className="btn primary small"
            onClick={() => open({ kind: "payment", id: b.id })}
          >
            <Plus size={14} />
            Add Payment
          </button>
        )}
      </div>
    </Panel>
  );
}
export function PaymentSchedule({ booking: b }: { booking: Booking }) {
  const { data, mutate, toast, addActivity } = useStudio(),
    { open } = useActions();
  const [editing, setEditing] = useState(false);
  const milestones = data.milestones.filter((m) => m.bookingId === b.id);
  return (
    <Panel
      title="Payment milestones"
      subtitle="A clear plan, from booking to delivery."
      action={
        <button className="text-action" onClick={() => setEditing(!editing)}>
          {editing ? "Done" : "Edit due dates"}
        </button>
      }
    >
      <div className="milestone-list">
        {milestones.map((m, i) => (
          <div className="milestone" key={m.id}>
            <span
              className={`milestone-marker ${m.paidAmount >= m.amount ? "done" : ""}`}
            >
              {m.paidAmount >= m.amount ? <Check size={15} /> : i + 1}
            </span>
            <div>
              <strong>{m.title}</strong>
              {editing ? (
                <input
                  aria-label={`${m.title} due date`}
                  type="date"
                  value={m.dueDate}
                  onChange={(e) => {
                    mutate((d) => {
                      d.milestones.find((x) => x.id === m.id)!.dueDate =
                        e.target.value;
                      if (i === 1)
                        d.bookings.find((x) => x.id === b.id)!.paymentDueDate =
                          e.target.value;
                    });
                    addActivity(b.id, `${m.title} due date updated`, "payment");
                    toast("Milestone due date saved.");
                  }}
                />
              ) : (
                <small>
                  {m.paidAmount >= m.amount
                    ? "Payment received"
                    : `Due ${dateLabel(m.dueDate)}`}
                  {m.paidAmount > 0 && m.paidAmount < m.amount
                    ? ` · ${money(m.paidAmount)} paid`
                    : ""}
                </small>
              )}
            </div>
            <strong>{money(m.amount)}</strong>
            <Badge>
              {m.paidAmount >= m.amount
                ? "Paid"
                : m.paidAmount > 0
                  ? "Partially Paid"
                  : "Pending"}
            </Badge>
            {m.paidAmount < m.amount && (
              <button
                className="icon-button"
                aria-label={`Record ${m.title} payment`}
                onClick={() => open({ kind: "payment", id: b.id })}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
export function ActivityTimeline({ bookingId }: { bookingId: string }) {
  const { data } = useStudio();
  const entries = data.activities
    .filter((a) => a.bookingId === bookingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="activity-timeline">
      {entries.map((a) => (
        <div className="activity-entry" key={a.id}>
          <span className={`activity-dot ${a.kind}`}>
            {a.kind === "payment" ? (
              <CreditCard size={14} />
            ) : a.kind === "project" ? (
              <PackageCheck size={14} />
            ) : a.kind === "note" ? (
              <MessageSquare size={14} />
            ) : (
              <Check size={14} />
            )}
          </span>
          <div>
            <strong>{a.text}</strong>
            <small>{dateLabel(a.createdAt, "d MMM yyyy · h:mm a")}</small>
          </div>
        </div>
      ))}
      {!entries.length && (
        <Empty title="The story starts here">
          Booking updates will appear automatically.
        </Empty>
      )}
    </div>
  );
}
export function ClientRequests({ projectId }: { projectId: string }) {
  const { data, mutate, addActivity, toast } = useStudio();
  const [adding, setAdding] = useState(false),
    [request, setRequest] = useState("");
  const requests = data.requests.filter((r) => r.projectId === projectId),
    p = data.projects.find((p) => p.id === projectId)!;
  return (
    <Panel
      title="Client requests"
      subtitle="The little things that mean everything."
      action={
        <span className="count-pill">
          {requests.filter((r) => r.done).length}/{requests.length}
        </span>
      }
      className="requests-panel"
    >
      <div className="requests-list">
        {requests.map((r) => (
          <label className={`request-item ${r.done ? "done" : ""}`} key={r.id}>
            <input
              type="checkbox"
              checked={r.done}
              onChange={(e) => {
                mutate(
                  (d) =>
                    (d.requests.find((x) => x.id === r.id)!.done =
                      e.target.checked),
                );
                addActivity(
                  p.bookingId,
                  `${e.target.checked ? "Completed" : "Reopened"} client request · ${r.text}`,
                  "project",
                );
              }}
            />
            <span>{r.text}</span>
          </label>
        ))}
        {!requests.length && (
          <p className="muted">
            Add the moments and preferences your client wants you to remember.
          </p>
        )}
        {adding ? (
          <form
            className="inline-add"
            onSubmit={(e) => {
              e.preventDefault();
              if (!request.trim()) return;
              mutate((d) =>
                d.requests.push({
                  id: uid(),
                  projectId,
                  text: request.trim(),
                  done: false,
                }),
              );
              addActivity(
                p.bookingId,
                `Client request added · ${request.trim()}`,
                "project",
              );
              setRequest("");
              setAdding(false);
              toast("Client request attached to this project.");
            }}
          >
            <textarea
              autoFocus
              required
              placeholder="e.g. Include more candid photos of grandparents."
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
            />
            <div className="button-row">
              <button
                type="button"
                className="btn small"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
              <button className="btn primary small">Save request</button>
            </div>
          </form>
        ) : (
          <button className="add-inline-button" onClick={() => setAdding(true)}>
            <Plus size={15} />
            Add Request
          </button>
        )}
      </div>
      <div className="request-footnote">
        <MessageSquare size={14} />
        Visible throughout editing and delivery.
      </div>
    </Panel>
  );
}
export function DeliverableList({ projectId }: { projectId: string }) {
  const { data, updateDeliverable } = useStudio(),
    { open } = useActions();
  const items = data.deliverables.filter((d) => d.projectId === projectId);
  return (
    <Panel
      title="Deliverables"
      subtitle="Everything you promised. Nothing forgotten."
      action={
        <button
          className="btn small"
          onClick={() => open({ kind: "new-deliverable", id: projectId })}
        >
          <Plus size={14} />
          Add Deliverable
        </button>
      }
    >
      <div className="deliverable-list">
        {items.map((item) => {
          const done = ["Approved", "Delivered"].includes(item.status);
          const member = data.team.find((t) => t.id === item.assigneeId)!;
          return (
            <div className="deliverable-row" key={item.id}>
              <button
                className={`circle-check ${done ? "checked" : ""}`}
                aria-label={`${done ? "Reopen" : "Approve"} ${item.title}`}
                onClick={() =>
                  updateDeliverable(item.id, {
                    status: done ? "Not Started" : "Approved",
                  })
                }
              >
                {done ? <Check size={13} /> : <Circle size={18} />}
              </button>
              <button
                className="deliverable-title"
                onClick={() => open({ kind: "deliverable", id: item.id })}
              >
                <strong>{item.title}</strong>
                <small>
                  {item.clientNotes ? (
                    <>
                      <MessageSquare size={12} />
                      Client notes attached
                    </>
                  ) : (
                    `Due ${dateLabel(item.dueDate, "d MMM")}`
                  )}
                </small>
              </button>
              <Avatar name={member.name} small color={member.color} />
              <Badge>{item.status}</Badge>
              <button
                className="icon-button"
                aria-label={`Edit ${item.title}`}
                onClick={() => open({ kind: "deliverable", id: item.id })}
              >
                <ArrowUpRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
