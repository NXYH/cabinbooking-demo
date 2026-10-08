import { format, parseISO } from "date-fns";
import type { Booking, Settings } from "./types";

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const hourLabel = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
export const timeRange = (start: number, hours: number) => `${hourLabel(start)} – ${hourLabel(start + hours)}`;
export const prettyDate = (d: string) => format(parseISO(d), "EEE, d MMM yyyy");

export const isWeekend = (date: string) => [0, 6].includes(parseISO(date).getDay());
export const rateFor = (s: Settings, date: string) => (isWeekend(date) ? s.weekendRate : s.weekdayRate);

export function quote(s: Settings, date: string, hours: number) {
  const rate = rateFor(s, date);
  const subtotal = rate * hours;
  const tax = Math.round((subtotal * s.taxRate) / 100);
  return { rate, subtotal, tax, total: subtotal + tax };
}

export type SlotState = "open" | "booked" | "blocked" | "closed" | "past";

/** State of one hourly slot. `ignoreId` lets an edited booking free its own slots. */
export function slotState(
  s: Settings,
  bookings: Booking[],
  date: string,
  hour: number,
  ignoreId?: string,
  now = new Date(),
): SlotState {
  const day = parseISO(date);
  if (!s.openDays[day.getDay()] || hour < s.openHour || hour >= s.closeHour) return "closed";
  if (s.blockedDates.some((b) => b.date === date) || s.blockedSlots[date]?.includes(hour)) return "blocked";
  const taken = bookings.some(
    (b) => b.id !== ignoreId && b.status !== "cancelled" && b.date === date && hour >= b.start && hour < b.start + b.hours,
  );
  if (taken) return "booked";
  const slotTime = new Date(day);
  slotTime.setHours(hour);
  if (slotTime <= now) return "past";
  return "open";
}

export function rangeFree(s: Settings, bookings: Booking[], date: string, start: number, hours: number, ignoreId?: string) {
  for (let h = start; h < start + hours; h++) if (slotState(s, bookings, date, h, ignoreId) !== "open") return false;
  return true;
}

export function hoursOfDay(s: Settings) {
  return Array.from({ length: s.closeHour - s.openHour }, (_, i) => s.openHour + i);
}

export interface Client {
  mobile: string;
  name: string;
  email: string;
  organisation: string;
  place: string;
  bookings: Booking[];
  spend: number;
  lastDate: string;
}

/** Clients are derived from bookings, keyed by mobile number. */
export function deriveClients(bookings: Booking[]): Client[] {
  const map = new Map<string, Client>();
  for (const b of [...bookings].sort((a, c) => a.createdAt.localeCompare(c.createdAt))) {
    const c = map.get(b.mobile) ?? { mobile: b.mobile, name: "", email: "", organisation: "", place: "", bookings: [], spend: 0, lastDate: "" };
    Object.assign(c, { name: b.contactName, email: b.email, organisation: b.organisation, place: b.place });
    c.bookings.push(b);
    if (b.payment.status === "paid") c.spend += b.total;
    if (b.date > c.lastDate) c.lastDate = b.date;
    map.set(b.mobile, c);
  }
  return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

export const validMobile = (m: string) => /^[6-9]\d{9}$/.test(m.replace(/\D/g, "").slice(-10));
export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export const normMobile = (m: string) => m.replace(/\D/g, "").slice(-10);
