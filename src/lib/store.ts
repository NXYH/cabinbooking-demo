"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Booking, EmailTemplate, Review, SentEmail, Settings, TemplateKey } from "./types";
import { defaultSettings, seedBookings, seedEmails, SEED_REVIEWS } from "./seed";
import { DEFAULT_TEMPLATES, fill, templateVars } from "./emails";
import { quote, rangeFree } from "./logic";

type NewBooking = Omit<Booking, "id" | "createdAt" | "subtotal" | "tax" | "total"> & { total?: number };

interface State {
  hydrated: boolean;
  bookings: Booking[];
  settings: Settings;
  reviews: Review[];
  templates: Record<TemplateKey, EmailTemplate>;
  outbox: SentEmail[];
  createBooking: (b: NewBooking) => Booking;
  updateBooking: (id: string, patch: Partial<Booking>) => Booking;
  setStatus: (id: string, status: Booking["status"]) => void;
  markPaid: (id: string, method: Booking["payment"]["method"]) => void;
  sendEmail: (key: TemplateKey, bookingId: string) => SentEmail | undefined;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleSlot: (date: string, hour: number) => void;
  toggleDate: (date: string, reason?: string) => void;
  addReview: (r: Omit<Review, "id" | "date" | "published">) => void;
  toggleReview: (id: string) => void;
  saveTemplate: (key: TemplateKey, patch: Partial<EmailTemplate>) => void;
  resetTemplate: (key: TemplateKey) => void;
  resetDemo: () => void;
}

function seed() {
  const settings = defaultSettings();
  const bookings = seedBookings(settings);
  return { settings, bookings, reviews: SEED_REVIEWS, templates: DEFAULT_TEMPLATES, outbox: seedEmails(bookings) };
}

const nextId = (bookings: Booking[]) =>
  `BMC-${Math.max(1000, ...bookings.map((b) => Number(b.id.split("-")[1]))) + 1}`;

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...seed(),

      createBooking: (input) => {
        const { bookings, settings } = get();
        if (!rangeFree(settings, bookings, input.date, input.start, input.hours))
          throw new Error("Those hours were just taken. Please pick another slot.");
        const q = quote(settings, input.date, input.hours);
        const b: Booking = { ...input, ...q, id: nextId(bookings), createdAt: new Date().toISOString() };
        set({ bookings: [...bookings, b] });
        return b;
      },

      updateBooking: (id, patch) => {
        const { bookings, settings } = get();
        const cur = bookings.find((b) => b.id === id)!;
        const next = { ...cur, ...patch };
        const slotChanged = next.date !== cur.date || next.start !== cur.start || next.hours !== cur.hours;
        if (slotChanged && next.status !== "cancelled" && !rangeFree(settings, bookings, next.date, next.start, next.hours, id))
          throw new Error("The selected hours overlap another booking or a blocked slot.");
        if (slotChanged) Object.assign(next, quote(settings, next.date, next.hours));
        set({ bookings: bookings.map((b) => (b.id === id ? next : b)) });
        return next;
      },

      setStatus: (id, status) => {
        const b = get().bookings.find((x) => x.id === id)!;
        const payment = status === "cancelled" && b.payment.status === "paid" ? { ...b.payment, status: "refunded" as const } : b.payment;
        set({ bookings: get().bookings.map((x) => (x.id === id ? { ...x, status, payment } : x)) });
        if (status === "confirmed") get().sendEmail("confirmed", id);
        if (status === "cancelled") get().sendEmail("cancelled", id);
      },

      markPaid: (id, method) =>
        set({
          bookings: get().bookings.map((b) =>
            b.id === id
              ? { ...b, payment: { status: "paid", method, paidAt: new Date().toISOString(), txnId: b.payment.txnId ?? `MAN${Date.now().toString().slice(-8)}` } }
              : b,
          ),
        }),

      sendEmail: (key, bookingId) => {
        const b = get().bookings.find((x) => x.id === bookingId);
        if (!b) return;
        const mail: SentEmail = {
          id: crypto.randomUUID(),
          template: key,
          bookingId,
          to: b.email,
          subject: fill(get().templates[key].subject, templateVars(b)),
          sentAt: new Date().toISOString(),
        };
        set({
          outbox: [mail, ...get().outbox],
          bookings: key === "review" ? get().bookings.map((x) => (x.id === bookingId ? { ...x, reviewRequested: true } : x)) : get().bookings,
        });
        return mail;
      },

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      toggleSlot: (date, hour) => {
        const s = get().settings;
        const cur = s.blockedSlots[date] ?? [];
        const next = cur.includes(hour) ? cur.filter((h) => h !== hour) : [...cur, hour];
        set({ settings: { ...s, blockedSlots: { ...s.blockedSlots, [date]: next } } });
      },

      toggleDate: (date, reason = "Blocked by admin") => {
        const s = get().settings;
        const exists = s.blockedDates.some((b) => b.date === date);
        set({
          settings: {
            ...s,
            blockedDates: exists ? s.blockedDates.filter((b) => b.date !== date) : [...s.blockedDates, { date, reason }],
          },
        });
      },

      addReview: (r) =>
        set({
          reviews: [
            { ...r, id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), published: r.rating >= 4 },
            ...get().reviews,
          ],
        }),

      toggleReview: (id) => set({ reviews: get().reviews.map((r) => (r.id === id ? { ...r, published: !r.published } : r)) }),

      saveTemplate: (key, patch) => set({ templates: { ...get().templates, [key]: { ...get().templates[key], ...patch } } }),
      resetTemplate: (key) => set({ templates: { ...get().templates, [key]: DEFAULT_TEMPLATES[key] } }),
      resetDemo: () => set(seed()),
    }),
    {
      name: "bookmycabin-demo-v2",
      skipHydration: true, // rehydrated in StoreHydrator after mount, so SSR markup matches the seed
      partialize: ({ bookings, settings, reviews, templates, outbox }) => ({ bookings, settings, reviews, templates, outbox }),
    },
  ),
);
