import { createContext, useContext, useState, type ReactNode } from "react";
import { addDays, parseISO, format, differenceInCalendarDays } from "./dates";
import {
  EDITING_STAGES,
  type BookingInput,
  type BookingStatus,
  type CalendarBlock,
  type Deliverable,
  type Payment,
  type StudioData,
} from "./types";
import { studioRepository } from "./repository";
import { createSeed } from "./seed";
import { balance, demoStamp, uid, money } from "./utils";
type Mutator = (data: StudioData) => void;
interface StudioContext {
  data: StudioData;
  mutate: (fn: Mutator) => void;
  toast: (message: string) => void;
  toasts: { id: string; text: string }[];
  addBooking: (input: BookingInput) => string;
  updateStatus: (id: string, status: BookingStatus) => void;
  recordPayment: (input: Omit<Payment, "id">) => boolean;
  addBlock: (block: Omit<CalendarBlock, "id">) => void;
  conflicts: (
    input: BookingInput,
    ignoreId?: string,
  ) => { title: string; detail: string }[];
  updateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  addActivity: (
    id: string,
    text: string,
    kind?: StudioData["activities"][number]["kind"],
  ) => void;
  reset: () => void;
}
const Context = createContext<StudioContext | null>(null);
const activity = (
  d: StudioData,
  bookingId: string,
  text: string,
  kind: StudioData["activities"][number]["kind"] = "booking",
) =>
  d.activities.unshift({
    id: uid(),
    bookingId,
    text,
    createdAt: demoStamp(),
    kind,
  });
export function StudioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(studioRepository.load);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  function toast(text: string) {
    const id = uid();
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      4500,
    );
  }
  function mutate(fn: Mutator) {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      if (!studioRepository.save(next))
        window.setTimeout(
          () =>
            toast(
              "Your browser storage is full. Changes are available for this session only.",
            ),
          0,
        );
      return next;
    });
  }
  function addBooking(input: BookingInput) {
    const bookingId = uid(),
      projectId = uid();
    mutate((d) => {
      let client = d.clients.find(
        (c) =>
          c.phone.replace(/\D/g, "") === input.phone.replace(/\D/g, "") ||
          (c.email &&
            input.email &&
            c.email.toLowerCase() === input.email.toLowerCase()),
      );
      if (!client) {
        client = {
          id: uid(),
          name: input.clientName,
          phone: input.phone,
          email: input.email,
          city: d.settings.city,
          notes: "",
        };
        d.clients.push(client);
      }
      const deadline = format(
        addDays(parseISO(input.eventDate), 27),
        "yyyy-MM-dd",
      );
      d.bookings.push({
        id: bookingId,
        clientId: client.id,
        eventType: input.eventType,
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: input.endTime,
        venue: input.venue,
        packageName: input.packageName,
        totalAmount: input.totalAmount,
        paidAmount: input.advance,
        paymentDueDate: input.paymentDueDate,
        status: input.advance > 0 ? "Confirmed" : "Awaiting Advance",
        assignedMembers: [input.memberId],
        createdAt: demoStamp(),
        notes: input.notes,
      });
      d.projects.push({
        id: projectId,
        bookingId,
        status: "Upcoming",
        deadline,
        editorId: d.team.find((t) => t.role === "Editor")!.id,
        completedStages: [],
      });
      [
        "Edited photographs",
        "Highlight film",
        "Client gallery",
        "Final archive",
      ].forEach((title) =>
        d.deliverables.push({
          id: uid(),
          projectId,
          title,
          description: "",
          status: "Not Started",
          assigneeId: input.memberId,
          dueDate: deadline,
          clientNotes: "",
          internalNotes: "",
          checklist: [],
        }),
      );
      if (input.advance)
        d.payments.push({
          id: uid(),
          bookingId,
          amount: input.advance,
          date: input.eventDate < "2026-10-10" ? input.eventDate : "2026-10-10",
          method: "Bank Transfer",
          reference: "",
          notes: "Booking advance",
        });
      let remaining = input.advance;
      const advance = Math.round(
          (input.totalAmount * d.settings.advance) / 100,
        ),
        before = Math.round((input.totalAmount * d.settings.beforeEvent) / 100);
      [
        ["Booking advance", advance, "2026-10-10"],
        ["Before event", before, input.paymentDueDate],
        ["Final delivery", input.totalAmount - advance - before, deadline],
      ].forEach(([title, amount, dueDate]) => {
        const paidAmount = Math.min(remaining, Number(amount));
        remaining -= paidAmount;
        d.milestones.push({
          id: uid(),
          bookingId,
          title: String(title),
          amount: Number(amount),
          paidAmount,
          dueDate: String(dueDate),
        });
      });
      activity(
        d,
        bookingId,
        "Booking created · calendar reserved · project prepared",
      );
      if (input.advance)
        activity(
          d,
          bookingId,
          `${money(input.advance)} advance received`,
          "payment",
        );
    });
    toast("Booking created. Client, calendar slot, and project are ready.");
    return bookingId;
  }
  function updateStatus(id: string, status: BookingStatus) {
    mutate((d) => {
      const b = d.bookings.find((b) => b.id === id)!;
      if (b.status === status) return;
      b.status = status;
      const p = d.projects.find((p) => p.bookingId === id)!;
      if (
        [
          "New Enquiry",
          "Proposal Sent",
          "Awaiting Advance",
          "Confirmed",
        ].includes(status)
      )
        p.status = "Upcoming";
      if (status === "Shoot Completed" || status === "Editing")
        p.status = "Editing";
      if (status === "Ready for Delivery") p.status = "Ready for Delivery";
      if (status === "Completed") {
        p.status = "Delivered";
        p.completedStages = [...EDITING_STAGES];
        d.deliverables
          .filter((x) => x.projectId === p.id)
          .forEach((x) => {
            x.status = "Delivered";
            x.completedAt = demoStamp();
          });
      }
      activity(
        d,
        id,
        status === "Shoot Completed"
          ? "Shoot completed · editing project started"
          : `Booking moved to ${status}`,
        "project",
      );
    });
    toast(
      status === "Shoot Completed"
        ? "Shoot completed. Your editing workspace is ready."
        : `Moved to ${status}`,
    );
  }
  function recordPayment(input: Omit<Payment, "id">) {
    const b = data.bookings.find((b) => b.id === input.bookingId)!;
    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      input.amount > balance(b)
    ) {
      toast("Enter an amount within the outstanding balance.");
      return false;
    }
    mutate((d) => {
      const booking = d.bookings.find((b) => b.id === input.bookingId)!;
      d.payments.push({ ...input, id: uid() });
      booking.paidAmount += input.amount;
      let rest = input.amount;
      d.milestones
        .filter((m) => m.bookingId === input.bookingId)
        .forEach((m) => {
          const applied = Math.min(rest, m.amount - m.paidAmount);
          m.paidAmount += applied;
          rest -= applied;
        });
      activity(
        d,
        booking.id,
        `${money(input.amount)} received via ${input.method}`,
        "payment",
      );
      if (!balance(booking))
        d.notifications
          .filter((n) => n.bookingId === booking.id && n.kind === "payment")
          .forEach((n) => (n.read = true));
    });
    toast(`${money(input.amount)} payment recorded. Balance updated.`);
    return true;
  }
  function conflicts(input: BookingInput, ignoreId?: string) {
    const start = new Date(`${input.eventDate}T${input.startTime}`).getTime(),
      end = new Date(`${input.eventDate}T${input.endTime}`).getTime();
    const results = data.bookings
      .filter(
        (b) =>
          b.id !== ignoreId &&
          !["Completed", "New Enquiry", "Proposal Sent"].includes(b.status) &&
          new Date(`${b.eventDate}T${b.startTime}`).getTime() < end &&
          new Date(`${b.eventDate}T${b.endTime}`).getTime() > start,
      )
      .map((b) => ({
        title: data.clients.find((c) => c.id === b.clientId)!.name,
        detail: `${b.eventType} · ${b.startTime}–${b.endTime} · ${b.venue}`,
      }));
    data.blocks.forEach((b) => {
      let bs = parseISO(b.start),
        be = parseISO(b.end);
      if (b.repeat === "Weekly") {
        const delta = differenceInCalendarDays(parseISO(input.eventDate), bs);
        const weeks = Math.floor(delta / 7);
        if (weeks >= 0) {
          bs = addDays(bs, weeks * 7);
          be = addDays(be, weeks * 7);
        }
      }
      if (b.repeat === "Monthly") {
        const target = parseISO(input.eventDate);
        const months =
          (target.getFullYear() - bs.getFullYear()) * 12 +
          target.getMonth() -
          bs.getMonth();
        if (months >= 0) {
          bs = new Date(bs);
          be = new Date(be);
          bs.setMonth(bs.getMonth() + months);
          be.setMonth(be.getMonth() + months);
        }
      }
      if (+bs < end && +be > start)
        results.push({
          title: b.reason,
          detail: `Unavailable · ${b.allDay ? "All day" : format(bs, "HH:mm") + "–" + format(be, "HH:mm")}`,
        });
    });
    return results;
  }
  const value: StudioContext = {
    data,
    mutate,
    toast,
    toasts,
    addBooking,
    updateStatus,
    recordPayment,
    conflicts,
    addBlock: (block) => {
      mutate((d) => d.blocks.push({ ...block, id: uid() }));
      toast("Time blocked. Availability updated.");
    },
    updateDeliverable: (id, patch) => {
      mutate((d) => {
        const x = d.deliverables.find((x) => x.id === id)!;
        Object.assign(x, patch);
        if (patch.status === "Delivered") x.completedAt = demoStamp();
        const p = d.projects.find((p) => p.id === x.projectId)!;
        activity(
          d,
          p.bookingId,
          `${x.title} updated${patch.status ? " · " + patch.status : ""}`,
          "project",
        );
      });
    },
    addActivity: (id, text, kind) => mutate((d) => activity(d, id, text, kind)),
    reset: () => {
      const fresh = createSeed();
      fresh.settings.onboarded = true;
      studioRepository.save(fresh);
      setData(fresh);
      toast("Demo workspace reset.");
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStudio() {
  const value = useContext(Context);
  if (!value) throw new Error("StudioProvider is required");
  return value;
}
