import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "../data/dates";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Plus,
  Trash2,
} from "lucide-react";
import { useStudio } from "../data/store";
import { clientFor, dateLabel, TODAY } from "../data/utils";
import { useActions } from "../components/actions";
import { Badge, Modal } from "../components/ui";
import type { CalendarBlock } from "../data/types";
type CalendarEvent = {
  id: string;
  title: string;
  detail: string;
  type: string;
  time?: string;
  end?: string;
  bookingId?: string;
  projectId?: string;
  block?: CalendarBlock;
};
export function CalendarPage() {
  const { data, mutate, toast } = useStudio(),
    { open } = useActions(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [date, setDate] = useState(parseISO(params.get("date") || TODAY)),
    [view, setView] = useState("Month"),
    [showDue, setShowDue] = useState(true),
    [selected, setSelected] = useState<string[] | null>(null),
    [block, setBlock] = useState<CalendarBlock | null>(null);
  const selection = useRef<{
    start: string;
    end: string;
    time: boolean;
  } | null>(null);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  });
  const weekDays =
    view === "Day"
      ? [date]
      : eachDayOfInterval({
          start: startOfWeek(date, { weekStartsOn: 1 }),
          end: endOfWeek(date, { weekStartsOn: 1 }),
        });
  function events(day: string): CalendarEvent[] {
    const result: CalendarEvent[] = data.bookings
      .filter((b) => b.eventDate === day && b.status !== "New Enquiry")
      .map((b) => ({
        id: b.id,
        title: clientFor(data, b).name,
        detail: `${b.eventType} · ${b.venue}`,
        type: [
          "Completed",
          "Shoot Completed",
          "Editing",
          "Ready for Delivery",
        ].includes(b.status)
          ? "completed"
          : ["Proposal Sent", "Awaiting Advance"].includes(b.status)
            ? "tentative"
            : "shoot",
        time: b.startTime,
        end: b.endTime,
        bookingId: b.id,
      }));
    if (showDue) {
      data.bookings
        .filter((b) => b.paymentDueDate === day && b.totalAmount > b.paidAmount)
        .forEach((b) =>
          result.push({
            id: b.id + "-due",
            title: `Payment · ${clientFor(data, b).name.split(" & ")[0]}`,
            detail: "Payment due",
            type: day < TODAY ? "overdue" : "payment",
            bookingId: b.id,
          }),
        );
      data.projects
        .filter((p) => p.deadline === day && p.status !== "Delivered")
        .forEach((p) =>
          result.push({
            id: p.id,
            title: `Delivery · ${
              clientFor(
                data,
                data.bookings.find((b) => b.id === p.bookingId)!,
              ).name.split(" & ")[0]
            }`,
            detail: "Editing deadline",
            type: "deadline",
            projectId: p.id,
          }),
        );
    }
    data.blocks.forEach((b) => {
      let start = parseISO(b.start),
        end = parseISO(b.end);
      const target = parseISO(day);
      if (b.repeat === "Weekly") {
        const delta = differenceInCalendarDays(target, start);
        if (delta >= 0) {
          const weeks = Math.floor(delta / 7);
          start = addDays(start, weeks * 7);
          end = addDays(end, weeks * 7);
        }
      } else if (b.repeat === "Monthly") {
        const months =
          (target.getFullYear() - start.getFullYear()) * 12 +
          target.getMonth() -
          start.getMonth();
        if (months >= 0) {
          start = new Date(start);
          end = new Date(end);
          start.setMonth(start.getMonth() + months);
          end.setMonth(end.getMonth() + months);
        }
      }
      if (start < addDays(target, 1) && end > target)
        result.push({
          id: b.id,
          title: b.reason,
          detail: b.allDay
            ? "Unavailable · All day"
            : `${format(start, "HH:mm")}–${format(end, "HH:mm")}`,
          type: "block",
          time: b.allDay ? undefined : format(start, "HH:mm"),
          end: b.allDay ? undefined : format(end, "HH:mm"),
          block: b,
        });
    });
    return result;
  }
  function openEvent(event: CalendarEvent) {
    if (event.block) setBlock(event.block);
    else if (event.projectId) navigate(`/projects/${event.projectId}`);
    else if (event.bookingId)
      navigate(
        `/bookings/${event.bookingId}${["overdue", "payment"].includes(event.type) ? "?tab=Payments" : ""}`,
      );
  }
  function begin(value: string, time: boolean) {
    selection.current = { start: value, end: value, time };
    setSelected([value, value]);
  }
  function extend(value: string) {
    if (selection.current) {
      selection.current.end = value;
      setSelected([selection.current.start, value].sort());
    }
  }
  function finish() {
    const value = selection.current;
    if (!value) return;
    selection.current = null;
    const [a, b] = [value.start, value.end].sort();
    setSelected(null);
    open({
      kind: "block",
      start: a,
      end: value.time
        ? format(new Date(+parseISO(b) + 3600000), "yyyy-MM-dd'T'HH:mm")
        : b,
    });
  }
  function shift(direction: number) {
    setDate((d) =>
      view === "Month"
        ? addMonths(d, direction)
        : view === "Week"
          ? addWeeks(d, direction)
          : addDays(d, direction),
    );
  }
  function eventButton(e: CalendarEvent, compact = false) {
    return (
      <button
        key={e.id}
        title={`${e.title} · ${e.detail}`}
        className={`calendar-event ${e.type} ${compact ? "compact" : ""}`}
        onPointerDown={(ev) => ev.stopPropagation()}
        onPointerUp={(ev) => ev.stopPropagation()}
        onClick={() => openEvent(e)}
      >
        {e.type === "block" && <LockKeyhole size={11} />}
        <span>
          {e.time && <small>{e.time} </small>}
          {e.title}
        </span>
        {!compact && <small>{e.detail}</small>}
      </button>
    );
  }
  const daySelected = (day: string) =>
    selected &&
    day >= selected[0].slice(0, 10) &&
    day <= selected[1].slice(0, 10);
  return (
    <div className="calendar-page page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE SPACE FOR EVERY STORY</div>
          <h1>Calendar</h1>
          <p>Your shoots, deadlines, and breathing room. All together.</p>
        </div>
        <div className="button-row">
          <button
            className="btn"
            onClick={() =>
              open({ kind: "block", start: format(date, "yyyy-MM-dd") })
            }
          >
            <LockKeyhole size={16} />
            Block Time
          </button>
          <button
            className="btn primary"
            onClick={() =>
              open({ kind: "booking", date: format(date, "yyyy-MM-dd") })
            }
          >
            <Plus size={16} />
            New Booking
          </button>
        </div>
      </div>
      <div className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-period">
            <button
              className="btn small"
              onClick={() => setDate(parseISO(TODAY))}
            >
              Today
            </button>
            <div className="button-row tight">
              <button
                className="icon-button"
                aria-label="Previous period"
                onClick={() => shift(-1)}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                className="icon-button"
                aria-label="Next period"
                onClick={() => shift(1)}
              >
                <ChevronRight size={19} />
              </button>
            </div>
            <h2>
              {format(date, view === "Day" ? "d MMMM yyyy" : "MMMM yyyy")}
            </h2>
          </div>
          <div className="view-switch">
            {["Month", "Week", "Day"].map((v) => (
              <button
                key={v}
                className={view === v ? "active" : ""}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="calendar-legend">
          <span>
            <i className="tiny-dot violet" />
            Confirmed shoot
          </span>
          <span>
            <i className="tiny-dot amber" />
            Tentative
          </span>
          <span>
            <i className="tiny-dot green" />
            Shoot completed
          </span>
          <span>
            <i className="tiny-dot red" />
            Payment due
          </span>
          <span>
            <i className="tiny-dot neutral" />
            Unavailable
          </span>
          <label>
            <input
              type="checkbox"
              checked={showDue}
              onChange={(e) => setShowDue(e.target.checked)}
            />
            Show deadlines & payments
          </label>
        </div>
        {view === "Month" ? (
          <div
            className="month-calendar"
            onPointerUp={finish}
            onPointerLeave={() => {
              if (selection.current) finish();
            }}
          >
            <div className="weekday-row">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="month-grid">
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd"),
                  items = events(key);
                return (
                  <div
                    key={key}
                    className={`month-cell ${!isSameMonth(day, date) ? "outside" : ""} ${key === TODAY ? "today" : ""} ${daySelected(key) ? "range-selected" : ""}`}
                    onPointerDown={(e) => {
                      if (e.button === 0) begin(key, false);
                    }}
                    onPointerEnter={() => extend(key)}
                  >
                    <button
                      className="day-number"
                      aria-label={`Block time on ${dateLabel(key)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!selection.current)
                          open({ kind: "block", start: key });
                      }}
                    >
                      {format(day, "d")}
                    </button>
                    <div className="day-events">
                      {items.slice(0, 3).map((e) => eventButton(e, true))}
                      {items.length > 3 && (
                        <button
                          className="more-events"
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          onClick={() => {
                            setDate(day);
                            setView("Day");
                          }}
                        >
                          +{items.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="week-calendar-scroll">
            <div
              className={`week-calendar ${view === "Day" ? "day-view" : ""}`}
            >
              <div className="time-header">
                <span>GMT+5:30</span>
                {weekDays.map((day) => (
                  <div
                    key={String(day)}
                    className={
                      format(day, "yyyy-MM-dd") === TODAY ? "today" : ""
                    }
                  >
                    <small>{format(day, "EEE")}</small>
                    <strong>{format(day, "d")}</strong>
                  </div>
                ))}
              </div>
              <div className="all-day-row">
                <span>All-day</span>
                {weekDays.map((day) => (
                  <div key={String(day)}>
                    {events(format(day, "yyyy-MM-dd"))
                      .filter((e) => !e.time)
                      .map((e) => eventButton(e, true))}
                  </div>
                ))}
              </div>
              <div
                className="time-grid"
                onPointerUp={finish}
                onPointerLeave={() => selection.current && finish()}
              >
                <div className="time-labels">
                  {Array.from({ length: 16 }, (_, i) => (
                    <span key={i}>{String(i + 6).padStart(2, "0")}:00</span>
                  ))}
                </div>
                {weekDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  return (
                    <div className="time-column" key={key}>
                      {Array.from({ length: 16 }, (_, i) => {
                        const value = `${key}T${String(i + 6).padStart(2, "0")}:00`;
                        return (
                          <div
                            key={i}
                            className={`time-slot ${selected && value >= selected[0] && value <= selected[1] ? "range-selected" : ""}`}
                            title={`Block ${format(day, "EEE d MMM")} at ${i + 6}:00`}
                            onPointerDown={(e) =>
                              e.button === 0 && begin(value, true)
                            }
                            onPointerEnter={() => extend(value)}
                          />
                        );
                      })}
                      {events(key)
                        .filter((e) => e.time)
                        .map((e) => {
                          const start = Math.max(
                              6,
                              Number(e.time!.split(":")[0]) +
                                Number(e.time!.split(":")[1]) / 60,
                            ),
                            end = Math.min(
                              22,
                              Number(e.end?.split(":")[0] || 7) +
                                Number(e.end?.split(":")[1] || 0) / 60,
                            );
                          return (
                            <div
                              key={e.id}
                              className="time-event"
                              style={{
                                top: (start - 6) * 48,
                                height: Math.max(36, (end - start) * 48),
                              }}
                            >
                              {eventButton(e)}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="calendar-bottom">
          <span>
            <CalendarDays size={15} />
            Click or drag across dates
            {view !== "Month" ? " and time slots" : ""} to block availability.
          </span>
          <span>Bookings reserve their shoot time automatically.</span>
        </div>
      </div>
      {block && (
        <Modal
          title="Unavailable time"
          subtitle="This block is included in booking conflict checks."
          onClose={() => setBlock(null)}
        >
          <div className="modal-body">
            <Badge tone="neutral">{block.reason}</Badge>
            <div className="detail-line">
              <span>Starts</span>
              <strong>{dateLabel(block.start, "d MMM yyyy, HH:mm")}</strong>
            </div>
            <div className="detail-line">
              <span>Ends</span>
              <strong>{dateLabel(block.end, "d MMM yyyy, HH:mm")}</strong>
            </div>
            <div className="detail-line">
              <span>Repeat</span>
              <strong>{block.repeat}</strong>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn danger"
              onClick={() => {
                mutate(
                  (d) => (d.blocks = d.blocks.filter((b) => b.id !== block.id)),
                );
                toast("Block removed. This time is available again.");
                setBlock(null);
              }}
            >
              <Trash2 size={16} />
              Remove block
            </button>
            <button className="btn" onClick={() => setBlock(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
