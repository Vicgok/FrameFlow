import { differenceInCalendarDays, format, parseISO } from "./dates";
import type { Booking, StudioData } from "./types";
export const TODAY = "2026-10-10";
export const NOW = parseISO(TODAY);
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const dateLabel = (value: string, pattern = "d MMM yyyy") =>
  value ? format(parseISO(value), pattern) : "—";
export const initials = (name: string) =>
  name
    .split(/\s+|&/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
export const balance = (b: Booking) =>
  Math.max(0, b.totalAmount - b.paidAmount);
export const paidPercent = (b: Booking) =>
  b.totalAmount
    ? Math.min(100, Math.round((b.paidAmount / b.totalAmount) * 100))
    : 0;
export const paymentStatus = (b: Booking) =>
  balance(b) === 0
    ? "Paid"
    : b.paymentDueDate < TODAY
      ? "Overdue"
      : b.paidAmount > 0
        ? "Partially Paid"
        : "Pending";
export const daysUntil = (day: string) =>
  differenceInCalendarDays(parseISO(day), NOW);
export const clientFor = (data: StudioData, booking: Booking) =>
  data.clients.find((c) => c.id === booking.clientId)!;
export const uid = () => crypto.randomUUID();
export const demoStamp = () => `${TODAY}T${format(new Date(), "HH:mm:ss")}`;
export const brand = {
  name: "FrameFlow",
  tagline: "A little less admin. A lot more focus.",
};
