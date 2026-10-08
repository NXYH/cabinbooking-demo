export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "refunded";
export type PayMethod = "UPI" | "Card" | "Netbanking" | "Wallet" | "Bank Transfer" | "Cash";

export interface Booking {
  id: string;
  date: string; // yyyy-MM-dd
  start: number; // hour of day, 0-23
  hours: number;
  pax: number;
  purpose: string;
  contactName: string;
  place: string;
  mobile: string; // 10 digits, the client key
  email: string;
  organisation: string;
  orgAddress?: string;
  gstin?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: BookingStatus;
  payment: { status: PaymentStatus; method: PayMethod; txnId?: string; paidAt?: string };
  source: "online" | "manual";
  createdAt: string; // ISO
  notes?: string;
  reviewRequested?: boolean;
}

export interface Settings {
  openDays: boolean[]; // index 0 = Sunday
  openHour: number;
  closeHour: number; // exclusive: last slot starts at closeHour - 1
  weekdayRate: number;
  weekendRate: number;
  minHours: number;
  maxPax: number;
  taxRate: number; // percent
  autoConfirm: boolean;
  advanceDays: number;
  blockedDates: { date: string; reason: string }[];
  blockedSlots: Record<string, number[]>;
}

export interface Review {
  id: string;
  name: string;
  organisation: string;
  rating: number;
  text: string;
  date: string;
  published: boolean;
}

export type TemplateKey = "received" | "confirmed" | "invoice" | "review" | "cancelled";

export interface EmailTemplate {
  key: TemplateKey;
  name: string;
  subject: string;
  html: string;
}

export interface SentEmail {
  id: string;
  template: TemplateKey;
  bookingId: string;
  to: string;
  subject: string;
  sentAt: string;
}
