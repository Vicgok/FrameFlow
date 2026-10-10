import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FileImage,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { useStudio } from "../data/store";
import { balance, dateLabel, money, TODAY } from "../data/utils";
import { Avatar, Badge, Empty, Panel } from "../components/ui";
import {
  ActivityTimeline,
  ClientRequests,
  PaymentSummary,
} from "../components/workflow";
import { useActions } from "../components/actions";
export function Clients() {
  const { data } = useStudio(),
    navigate = useNavigate();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All clients");
  const clients = data.clients.filter(
    (c) =>
      `${c.name} ${c.phone} ${c.email}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All clients" ||
        (filter === "Outstanding balance" &&
          data.bookings.some((b) => b.clientId === c.id && balance(b) > 0)) ||
        (filter === "Upcoming event" &&
          data.bookings.some(
            (b) => b.clientId === c.id && b.eventDate >= TODAY,
          )) ||
        (filter === "In editing" &&
          data.projects.some(
            (p) =>
              p.status === "Editing" &&
              data.bookings.find((b) => b.id === p.bookingId)?.clientId ===
                c.id,
          ))),
  );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">RELATIONSHIPS, NOT JUST RECORDS</div>
          <h1>
            Clients<span className="heading-count">{data.clients.length}</span>
          </h1>
          <p>Every contact, conversation, and client story in one place.</p>
        </div>
        <div className="client-total">
          <Users size={19} />
          <span>
            <strong>{data.clients.length} clients</strong>
            <small>Growing with your studio</small>
          </span>
        </div>
      </div>
      <div className="booking-toolbar">
        <div className="type-tabs">
          {[
            "All clients",
            "Upcoming event",
            "Outstanding balance",
            "In editing",
          ].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="input-with-icon compact-input">
          <Search size={16} />
          <input
            aria-label="Search clients"
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CLIENT</th>
                <th>UPCOMING EVENT</th>
                <th>TOTAL VALUE</th>
                <th>AMOUNT DUE</th>
                <th>PROJECT STATUS</th>
                <th>LAST ACTIVITY</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const bookings = data.bookings.filter(
                    (b) => b.clientId === c.id,
                  ),
                  b = bookings[0],
                  p = data.projects.find((p) => p.bookingId === b?.id);
                const last = data.activities
                  .filter((a) => bookings.some((b) => b.id === a.bookingId))
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
                return (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="client-link"
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        <Avatar name={c.name} />
                        <span>
                          <strong>{c.name}</strong>
                          <small>{c.phone}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      {b?.eventDate >= TODAY ? (
                        <>
                          <strong>{b.eventType}</strong>
                          <small>{dateLabel(b.eventDate)}</small>
                        </>
                      ) : (
                        <span className="muted">No upcoming event</span>
                      )}
                    </td>
                    <td>
                      {money(bookings.reduce((s, b) => s + b.totalAmount, 0))}
                    </td>
                    <td>
                      <strong>
                        {money(bookings.reduce((s, b) => s + balance(b), 0))}
                      </strong>
                    </td>
                    <td>
                      <Badge>{p?.status || "New client"}</Badge>
                    </td>
                    <td>
                      <small>
                        {last
                          ? dateLabel(last.createdAt, "d MMM yyyy")
                          : "Just added"}
                      </small>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Open ${c.name} client`}
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!clients.length && (
          <Empty title="No clients match your search">
            Try a name, email, or phone number.
          </Empty>
        )}
        <div className="table-footer">
          <span>{clients.length} clients</span>
          <span>
            New clients are created automatically with their first booking.
          </span>
        </div>
      </div>
    </div>
  );
}
export function ClientProfile() {
  const { id } = useParams(),
    navigate = useNavigate();
  const { data, mutate, toast } = useStudio(),
    { open } = useActions();
  const [note, setNote] = useState("");
  const c = data.clients.find((c) => c.id === id);
  if (!c) return <Empty title="Client not found" />;
  const bookings = data.bookings.filter((b) => b.clientId === id),
    b = bookings.find((b) => b.status !== "Completed") || bookings[0],
    p = data.projects.find((p) => p.bookingId === b?.id);
  return (
    <div className="page-enter">
      <button className="back-link" onClick={() => navigate("/clients")}>
        <ArrowLeft size={15} />
        All clients
      </button>
      <div className="page-heading client-profile-heading">
        <div className="profile-identity">
          <Avatar name={c.name} />
          <div>
            <div className="eyebrow">CLIENT PROFILE</div>
            <h1>{c.name}</h1>
            <p>
              {c.phone} · {c.email} · {c.city}
            </p>
          </div>
        </div>
        <div className="button-row">
          <button
            className="btn"
            onClick={() => b && open({ kind: "reminder", id: b.id })}
          >
            <MessageCircle size={15} />
            WhatsApp
          </button>
          <a className="btn" href={`tel:${c.phone.replace(/\s/g, "")}`}>
            <Phone size={15} />
            Call
          </a>
          {c.email && (
            <a className="btn" href={`mailto:${c.email}`}>
              <Mail size={15} />
              Email
            </a>
          )}
        </div>
      </div>
      <div className="workspace-columns">
        <div>
          {b && (
            <>
              <Panel title="Active booking" action={<Badge>{b.status}</Badge>}>
                <button
                  className="active-booking"
                  onClick={() => navigate(`/bookings/${b.id}`)}
                >
                  <span className="date-tile">
                    <small>{dateLabel(b.eventDate, "MMM")}</small>
                    <strong>{dateLabel(b.eventDate, "dd")}</strong>
                  </span>
                  <div>
                    <h3>{b.eventType} Photography</h3>
                    <p>
                      {b.venue} · {b.startTime}
                    </p>
                    <small>{b.packageName}</small>
                  </div>
                  <ArrowRight size={18} />
                </button>
              </Panel>
              <PaymentSummary booking={b} />
            </>
          )}
          <Panel title="Booking history">
            <div className="booking-history">
              {bookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                >
                  <div>
                    <strong>
                      {b.eventType} · {b.packageName}
                    </strong>
                    <small>
                      {dateLabel(b.eventDate)} · {b.venue}
                    </small>
                  </div>
                  <span>{money(b.totalAmount)}</span>
                  <Badge>{b.status}</Badge>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </Panel>
          {b && (
            <Panel
              title="Activity timeline"
              subtitle="A shared memory for your studio."
            >
              <ActivityTimeline bookingId={b.id} />
            </Panel>
          )}
        </div>
        <div>
          {p && <ClientRequests projectId={p.id} />}
          <Panel title="Client notes">
            <form
              className="notes-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                mutate((d) => {
                  const client = d.clients.find((c) => c.id === id)!;
                  client.notes = `${client.notes}${client.notes ? "\n\n" : ""}${note.trim()}`;
                });
                setNote("");
                toast("Client note saved.");
              }}
            >
              <p className="existing-notes">
                {c.notes || "Keep useful context about this relationship here."}
              </p>
              <textarea
                aria-label="New client note"
                required
                rows={3}
                placeholder="Add a thoughtful detail..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn small" type="submit">
                Save note
              </button>
            </form>
          </Panel>
          <Panel title="Client files">
            <div className="files-placeholder">
              <FileImage size={28} />
              <strong>A home for their files.</strong>
              <p>
                Gallery links, moodboards, and files will live here when file
                storage is connected.
              </p>
              <Badge tone="neutral">Coming after validation</Badge>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
