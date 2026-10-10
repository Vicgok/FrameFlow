import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CreditCard,
  Search,
  Send,
  TrendingUp,
} from "lucide-react";
import { useStudio } from "../data/store";
import {
  balance,
  clientFor,
  dateLabel,
  money,
  paymentStatus,
  paidPercent,
} from "../data/utils";
import { Avatar, Badge, Empty, Modal, Progress } from "../components/ui";
import { useActions } from "../components/actions";
export function Payments() {
  const { data, toast } = useStudio(),
    { open } = useActions(),
    navigate = useNavigate(),
    [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(""),
    [history, setHistory] = useState(false);
  const filter = params.get("filter") || "all";
  const total = data.bookings.reduce((s, b) => s + b.totalAmount, 0),
    collected = data.bookings.reduce((s, b) => s + b.paidAmount, 0),
    pending = total - collected,
    overdue = data.bookings
      .filter((b) => paymentStatus(b) === "Overdue")
      .reduce((s, b) => s + balance(b), 0);
  const rows = data.bookings.filter(
    (b) =>
      (filter === "all" ||
        (filter === "pending" && balance(b) > 0) ||
        (filter === "overdue" && paymentStatus(b) === "Overdue") ||
        (filter === "collected" && b.paidAmount > 0) ||
        (filter === "paid" && !balance(b))) &&
      `${clientFor(data, b).name} ${b.eventType}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function exportPayments() {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      ["Client", "Booking", "Total", "Paid", "Balance", "Due", "Status"],
      ...rows.map((b) => [
        clientFor(data, b).name,
        b.eventType,
        b.totalAmount,
        b.paidAmount,
        balance(b),
        b.paymentDueDate,
        paymentStatus(b),
      ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "FrameFlow-payments.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Payment report exported.");
  }
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR MONEY, WITHOUT THE GUESSWORK</div>
          <h1>Payments</h1>
          <p>Know what’s collected, what’s coming, and what needs a nudge.</p>
        </div>
        <button className="btn" onClick={exportPayments}>
          <ArrowDownToLine size={16} />
          Export report
        </button>
      </div>
      <div className="metrics-strip payment-metrics">
        {[
          ["Total booking value", total, "all", CreditCard],
          ["Collected", collected, "collected", TrendingUp],
          ["Pending", pending, "pending", CreditCard],
          ["Overdue", overdue, "overdue", CreditCard],
        ].map(([title, value, key, Icon]) => {
          const Component = Icon as typeof CreditCard;
          return (
            <button
              className={`metric ${filter === key ? "selected" : ""}`}
              key={String(title)}
              onClick={() => setParams({ filter: String(key) })}
            >
              <span className="metric-label">
                {String(title)}
                <Component size={16} />
              </span>
              <strong
                className={
                  key === "collected"
                    ? "green-text"
                    : key === "overdue"
                      ? "red-text"
                      : ""
                }
              >
                {money(Number(value))}
              </strong>
              <span className="metric-foot">
                <i>
                  {key === "all"
                    ? "Across all your bookings"
                    : key === "collected"
                      ? "Receipts recorded & reconciled"
                      : key === "pending"
                        ? "Outstanding client balances"
                        : `${data.bookings.filter((b) => paymentStatus(b) === "Overdue").length} bookings need a follow-up`}
                </i>
                <ArrowUpRight size={14} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="financial-callout">
        <span className="attention-icon violet">
          <CreditCard size={20} />
        </span>
        <div>
          <strong>A clear path from advance to final payment.</strong>
          <p>
            Payment milestones and balances stay in sync with every receipt.
          </p>
        </div>
        <button className="text-action" onClick={() => setHistory(true)}>
          View receipts
          <ArrowRightIcon />
        </button>
      </div>
      <div className="panel table-panel">
        <div className="table-toolbar">
          <div className="type-tabs">
            {[
              ["all", "All payments"],
              ["pending", "Outstanding"],
              ["overdue", "Overdue"],
              ["paid", "Fully paid"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? "active" : ""}
                onClick={() => setParams({ filter: key })}
              >
                {label}
                {key === "overdue" && (
                  <span>
                    {
                      data.bookings.filter(
                        (b) => paymentStatus(b) === "Overdue",
                      ).length
                    }
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="input-with-icon compact-input">
            <Search size={16} />
            <input
              placeholder="Search payments..."
              aria-label="Search payments"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="table-scroll desktop-payment-table">
          <table className="payment-table">
            <thead>
              <tr>
                <th>CLIENT / BOOKING</th>
                <th>TOTAL</th>
                <th>PAID</th>
                <th>BALANCE</th>
                <th>NEXT DUE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <button
                      className="client-link"
                      onClick={() => navigate(`/bookings/${b.id}?tab=Payments`)}
                    >
                      <Avatar name={clientFor(data, b).name} />
                      <span>
                        <strong>{clientFor(data, b).name}</strong>
                        <small>
                          {b.eventType} · {dateLabel(b.eventDate, "d MMM")}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>{money(b.totalAmount)}</td>
                  <td>
                    <strong className="green-text">
                      {money(b.paidAmount)}
                    </strong>
                    <Progress value={paidPercent(b)} tone="green" />
                  </td>
                  <td>
                    <strong>{money(balance(b))}</strong>
                  </td>
                  <td
                    className={paymentStatus(b) === "Overdue" ? "red-text" : ""}
                  >
                    {balance(b)
                      ? dateLabel(b.paymentDueDate, "d MMM yyyy")
                      : "—"}
                  </td>
                  <td>
                    <Badge>{paymentStatus(b)}</Badge>
                  </td>
                  <td>
                    {balance(b) ? (
                      <div className="payment-row-actions">
                        <button
                          className="btn small"
                          onClick={() => open({ kind: "payment", id: b.id })}
                        >
                          Record Payment
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Remind ${clientFor(data, b).name}`}
                          title="Send reminder"
                          onClick={() => open({ kind: "reminder", id: b.id })}
                        >
                          <Send size={15} />
                        </button>
                      </div>
                    ) : (
                      <span className="settled">
                        <Check size={14} />
                        Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mobile-payment-list">
          {rows.map((b) => (
            <article className="mobile-payment-card" key={b.id}>
              <div className="mobile-card-heading">
                <button
                  className="client-link"
                  onClick={() => navigate(`/bookings/${b.id}?tab=Payments`)}
                >
                  <Avatar name={clientFor(data, b).name} />
                  <span>
                    <strong>{clientFor(data, b).name}</strong>
                    <small>
                      {b.eventType} · {dateLabel(b.eventDate, "d MMM")}
                    </small>
                  </span>
                </button>
                <Badge>{paymentStatus(b)}</Badge>
              </div>
              <div className="mobile-payment-values">
                <div>
                  <span>Total</span>
                  <strong>{money(b.totalAmount)}</strong>
                </div>
                <div>
                  <span>Collected</span>
                  <strong className="green-text">{money(b.paidAmount)}</strong>
                </div>
                <div>
                  <span>Balance</span>
                  <strong>{money(balance(b))}</strong>
                </div>
              </div>
              <Progress
                value={paidPercent(b)}
                tone={balance(b) ? "violet" : "green"}
              />
              <div className="mobile-card-foot">
                <span
                  className={paymentStatus(b) === "Overdue" ? "red-text" : ""}
                >
                  {balance(b)
                    ? `Due ${dateLabel(b.paymentDueDate, "d MMM")}`
                    : "All settled"}
                </span>
                {balance(b) > 0 && (
                  <div className="button-row">
                    <button
                      className="icon-button"
                      aria-label={`Remind ${clientFor(data, b).name}`}
                      onClick={() => open({ kind: "reminder", id: b.id })}
                    >
                      <Send size={15} />
                    </button>
                    <button
                      className="btn small"
                      onClick={() => open({ kind: "payment", id: b.id })}
                    >
                      Record Payment
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        {!rows.length && (
          <Empty title="No payments in this view">
            Try another filter or client name.
          </Empty>
        )}
        <div className="table-footer">
          <span>{rows.length} bookings</span>
          <strong>
            {money(rows.reduce((s, b) => s + balance(b), 0))} outstanding in
            this view
          </strong>
        </div>
      </div>
      {history && (
        <Modal
          title="Payment receipts"
          subtitle="Every receipt, saved in your studio’s history."
          onClose={() => setHistory(false)}
          wide
        >
          <div className="modal-body receipt-list">
            {[...data.payments]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((p) => {
                const b = data.bookings.find((b) => b.id === p.bookingId)!;
                return (
                  <div className="receipt-row" key={p.id}>
                    <span className="attention-icon green">
                      <CreditCard size={17} />
                    </span>
                    <div>
                      <strong>{clientFor(data, b).name}</strong>
                      <small>
                        {dateLabel(p.date)} · {p.method} ·{" "}
                        {p.reference || "No reference"}
                      </small>
                      {p.notes && <small>{p.notes}</small>}
                    </div>
                    <strong>{money(p.amount)}</strong>
                  </div>
                );
              })}
          </div>
        </Modal>
      )}
    </div>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={15} />;
}
