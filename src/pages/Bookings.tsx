import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BoardDragContext,
  DragOverlay,
  useBoardDrag,
  useBoardDrop,
  type DragEndEvent,
} from "../components/drag-and-drop";
import {
  ArrowDownUp,
  CalendarDays,
  Camera,
  ChevronRight,
  GripVertical,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useStudio } from "../data/store";
import {
  BOOKING_STATUSES,
  EVENT_TYPES,
  type Booking,
  type BookingStatus,
} from "../data/types";
import {
  balance,
  clientFor,
  dateLabel,
  daysUntil,
  money,
  paidPercent,
  paymentStatus,
  TODAY,
} from "../data/utils";
import { Avatar, Badge, Empty, Progress } from "../components/ui";
import { useActions } from "../components/actions";
export function Bookings() {
  const { data, updateStatus } = useStudio(),
    { open } = useActions(),
    navigate = useNavigate();
  const [view, setView] = useState("board"),
    [type, setType] = useState("All"),
    [filter, setFilter] = useState("All bookings"),
    [query, setQuery] = useState(""),
    [active, setActive] = useState<Booking | null>(null);
  const bookings = data.bookings.filter(
    (b) =>
      (type === "All" || b.eventType === type) &&
      `${clientFor(data, b).name} ${clientFor(data, b).phone} ${b.eventType} ${b.venue}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All bookings" ||
        (filter === "This month" && b.eventDate.startsWith("2026-10")) ||
        (filter === "This week" &&
          daysUntil(b.eventDate) >= 0 &&
          daysUntil(b.eventDate) <= 7) ||
        (filter === "Pending payment" && balance(b) > 0) ||
        (filter === "Upcoming shoot" &&
          b.eventDate >= TODAY &&
          !["Editing", "Completed", "Ready for Delivery"].includes(b.status)) ||
        (filter === "Editing" && b.status === "Editing") ||
        (filter === "Overdue" && paymentStatus(b) === "Overdue")),
  );
  function dragEnd(e: DragEndEvent) {
    setActive(null);
    if (e.over && BOOKING_STATUSES.includes(String(e.over.id) as BookingStatus))
      updateStatus(String(e.active.id), String(e.over.id) as BookingStatus);
  }
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY CLIENT STORY, ORGANIZED</div>
          <h1>
            Bookings
            <span className="heading-count">{data.bookings.length}</span>
          </h1>
          <p>From the first hello to the final handoff.</p>
        </div>
        <button
          className="btn primary"
          onClick={() => open({ kind: "booking" })}
        >
          <Plus size={17} />
          New Booking
        </button>
      </div>
      <div className="booking-toolbar">
        <div className="type-tabs">
          {["All", ...EVENT_TYPES].map((t) => (
            <button
              key={t}
              className={type === t ? "active" : ""}
              onClick={() => setType(t)}
            >
              {t}
              {t === "All" && <span>{data.bookings.length}</span>}
            </button>
          ))}
        </div>
        <div className="view-switch">
          <button
            aria-label="Board view"
            className={view === "board" ? "active" : ""}
            onClick={() => setView("board")}
          >
            <LayoutGrid size={16} />
            Board
          </button>
          <button
            aria-label="List view"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>
      <div className="filter-row">
        <div className="input-with-icon">
          <Search size={17} />
          <input
            aria-label="Search bookings"
            placeholder="Search clients, events or phone numbers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="select-with-icon">
          <SlidersHorizontal size={15} />
          <select
            aria-label="Filter bookings"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "All bookings",
              "This week",
              "This month",
              "Pending payment",
              "Upcoming shoot",
              "Editing",
              "Overdue",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <span className="filter-count">{bookings.length} bookings</span>
        {view === "board" && (
          <span className="drag-hint">
            <GripVertical size={14} />
            Drag a card to move its story forward
          </span>
        )}
      </div>
      {view === "board" ? (
        <BoardDragContext
          onDragStart={(e) =>
            setActive(data.bookings.find((b) => b.id === e.active.id)!)
          }
          onDragEnd={dragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="kanban-scroll">
            <div className="kanban">
              {BOOKING_STATUSES.map((status, index) => (
                <Column
                  key={status}
                  status={status}
                  index={index}
                  count={bookings.filter((b) => b.status === status).length}
                  add={() => open({ kind: "booking" })}
                >
                  {bookings
                    .filter((b) => b.status === status)
                    .map((b) => (
                      <DraggableCard
                        key={b.id}
                        booking={b}
                        open={() => navigate(`/bookings/${b.id}`)}
                      />
                    ))}
                </Column>
              ))}
            </div>
          </div>
          <DragOverlay>
            {active && <BookingCard booking={active} dragging />}
          </DragOverlay>
        </BoardDragContext>
      ) : (
        <div className="panel table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>CLIENT / EVENT</th>
                  <th>DATE & VENUE</th>
                  <th>BOOKING VALUE</th>
                  <th>PAYMENT</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bookings
                  .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                  .map((b) => (
                    <tr key={b.id}>
                      <td>
                        <button
                          className="client-link"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          <Avatar name={clientFor(data, b).name} />
                          <span>
                            <strong>{clientFor(data, b).name}</strong>
                            <small>
                              {b.eventType} · {b.packageName}
                            </small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <strong>{dateLabel(b.eventDate)}</strong>
                        <small>{b.venue}</small>
                      </td>
                      <td>{money(b.totalAmount)}</td>
                      <td>
                        <div className="table-progress">
                          <Progress value={paidPercent(b)} />
                          <span>{paidPercent(b)}%</span>
                        </div>
                        <small>{money(balance(b))} remaining</small>
                      </td>
                      <td>
                        <select
                          aria-label={`Status for ${clientFor(data, b).name}`}
                          className="status-select"
                          value={b.status}
                          onChange={(e) =>
                            updateStatus(b.id, e.target.value as BookingStatus)
                          }
                        >
                          {BOOKING_STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          aria-label={`Open ${clientFor(data, b).name} booking`}
                          className="icon-button"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          <ChevronRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!bookings.length && (
            <Empty
              title="No bookings match your filters"
              action={
                <button
                  className="btn"
                  onClick={() => {
                    setType("All");
                    setFilter("All bookings");
                    setQuery("");
                  }}
                >
                  Clear filters
                </button>
              }
            >
              Try another name or give your filters a little breathing room.
            </Empty>
          )}
        </div>
      )}
    </div>
  );
}
function Column({
  status,
  index,
  count,
  children,
  add,
}: {
  status: BookingStatus;
  index: number;
  count: number;
  children: React.ReactNode;
  add: () => void;
}) {
  const { setNodeRef, isOver } = useBoardDrop({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "drag-over" : ""}`}
    >
      <div className="column-heading">
        <span className={`stage-dot stage-${index}`} />
        <h2>{status}</h2>
        <span>{count}</span>
        <button
          className="icon-button"
          title={`Add booking to workspace`}
          aria-label={`Add a booking from ${status}`}
          onClick={add}
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="column-cards">
        {children}
        {!count && (
          <div className="column-empty">
            <span>Room for the next story</span>
            <small>Drop a booking here</small>
          </div>
        )}
      </div>
    </section>
  );
}
function DraggableCard({
  booking,
  open,
}: {
  booking: Booking;
  open: () => void;
}) {
  const { attributes, listeners, isDragging } = useBoardDrag({
    id: booking.id,
  });
  return (
    <div
      style={{
        opacity: isDragging ? 0.25 : 1,
      }}
    >
      <BookingCard
        booking={booking}
        onClick={open}
        dragProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}
function BookingCard({
  booking: b,
  onClick,
  dragging,
  dragProps,
}: {
  booking: Booking;
  onClick?: () => void;
  dragging?: boolean;
  dragProps?: Record<string, unknown>;
}) {
  const { data } = useStudio();
  const team = data.team.find((t) => t.id === b.assignedMembers[0])!;
  return (
    <article className={`booking-card ${dragging ? "dragging" : ""}`}>
      <div className="card-top">
        <Badge tone="neutral">{b.eventType}</Badge>
        <button
          className="drag-handle"
          aria-label={`Drag ${clientFor(data, b).name}`}
          title="Drag to change status. Space to pick up, arrows to move, Space to drop."
          {...dragProps}
        >
          <GripVertical size={17} />
        </button>
      </div>
      <button className="card-open" onClick={onClick}>
        <h3>{clientFor(data, b).name}</h3>
        <p>
          <CalendarDays size={13} />
          {dateLabel(b.eventDate)}
        </p>
        <p>
          <MapPin size={13} />
          {b.venue.split(",")[0]}
        </p>
        <div className="card-package">{b.packageName}</div>
        <div className="card-value">
          <strong>{money(b.totalAmount)}</strong>
          <span>{paidPercent(b)}% paid</span>
        </div>
        <Progress
          value={paidPercent(b)}
          tone={balance(b) === 0 ? "green" : "violet"}
        />
        <small className="card-paid">
          {money(b.paidAmount)} collected
          {paymentStatus(b) === "Overdue" && <i className="overdue-dot" />}
        </small>
      </button>
      <div className="card-footer">
        <span>
          <Avatar name={team.name} small color={team.color} />
          {team.name.split(" ")[0]}
          {b.assignedMembers.length > 1 && ` +${b.assignedMembers.length - 1}`}
        </span>
        <small
          className={
            daysUntil(b.eventDate) <= 1 && daysUntil(b.eventDate) >= 0
              ? "amber-text"
              : ""
          }
        >
          {daysUntil(b.eventDate) >= 0
            ? `Shoot in ${daysUntil(b.eventDate)}d`
            : b.status === "Completed"
              ? "Delivered"
              : "In post-production"}
        </small>
      </div>
    </article>
  );
}
