// Small local date helpers keep the prototype independent of a date runtime.
export const parseISO = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00` : value);
export const addDays = (date: Date, n: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
export const addWeeks = (date: Date, n: number) => addDays(date, n * 7);
export const addMonths = (date: Date, n: number) => {
  const d = new Date(date),
    day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(
    Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()),
  );
  return d;
};
export const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);
export const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
export const startOfWeek = (date: Date, options?: { weekStartsOn: number }) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return addDays(d, -((d.getDay() - (options?.weekStartsOn || 0) + 7) % 7));
};
export const endOfWeek = (date: Date, options?: { weekStartsOn: number }) => {
  const d = addDays(startOfWeek(date, options), 6);
  d.setHours(23, 59, 59, 999);
  return d;
};
export const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
export const differenceInCalendarDays = (a: Date, b: Date) =>
  Math.round(
    (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
      Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) /
      86400000,
  );
export function eachDayOfInterval({ start, end }: { start: Date; end: Date }) {
  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}
export function format(d: Date, pattern: string) {
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  const tokens: Record<string, string> = {
    yyyy: String(d.getFullYear()),
    MMMM: d.toLocaleDateString("en-IN", { month: "long" }),
    MMM: d.toLocaleDateString("en-IN", { month: "short" }),
    MM: pad(d.getMonth() + 1),
    M: String(d.getMonth() + 1),
    dd: pad(d.getDate()),
    d: String(d.getDate()),
    EEEE: d.toLocaleDateString("en-IN", { weekday: "long" }),
    EEE: d.toLocaleDateString("en-IN", { weekday: "short" }),
    EEEEE: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 1),
    HH: pad(d.getHours()),
    H: String(d.getHours()),
    hh: pad(d.getHours() % 12 || 12),
    h: String(d.getHours() % 12 || 12),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
    a: d.getHours() >= 12 ? "PM" : "AM",
  };
  return pattern.replace(
    /'([^']*)'|yyyy|MMMM|MMM|MM|M|EEEEE|EEEE|EEE|dd|d|HH|H|hh|h|mm|ss|a/g,
    (token, literal) =>
      literal !== undefined ? literal : tokens[token] || token,
  );
}
