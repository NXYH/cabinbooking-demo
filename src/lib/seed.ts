import { addDays, format, subDays } from "date-fns";
import type { Booking, PayMethod, Review, SentEmail, Settings } from "./types";
import { quote } from "./logic";
import { PURPOSES } from "./venue";
import { DEFAULT_TEMPLATES, fill, templateVars } from "./emails";

// Deterministic PRNG so server and client render the same seed.
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLIENTS = [
  ["Arjun Menon", "Bluewater Fintech", "Kochi", "9847012301", "arjun.menon@bluewaterfin.in"],
  ["Priya Nair", "Malabar Spice Exports", "Kozhikode", "9895023412", "priya@malabarspice.co"],
  ["Rahul Varma", "Nila Software Labs", "Kochi", "9746034523", "rahul.v@nilalabs.io"],
  ["Ananya Krishnan", "Lumen Learning Academy", "Thrissur", "9633045634", "ananya@lumenlearning.in"],
  ["Vivek Pillai", "Coastline Realty", "Kochi", "9447056745", "vivek.pillai@coastlinerealty.in"],
  ["Meera Thomas", "Periyar Health Systems", "Kottayam", "9567067856", "meera.thomas@periyarhealth.org"],
  ["Sanjay Iyer", "Riverstone Capital", "Bengaluru", "9880078967", "sanjay@riverstone.capital"],
  ["Fathima Rasheed", "Saffron Hospitality Group", "Kochi", "9605089078", "fathima.r@saffronhg.com"],
  ["Nikhil George", "Tidewave Logistics", "Kochi", "9400090189", "nikhil.george@tidewave.in"],
  ["Divya Raghavan", "Anantha Architects", "Thiruvananthapuram", "9846101290", "divya@ananthaarch.in"],
  ["Karthik Subramanian", "Arcadia Pharma", "Chennai", "9840112301", "karthik.s@arcadiapharma.com"],
  ["Sneha Joseph", "Monsoon Media House", "Kochi", "9745123412", "sneha@monsoonmedia.in"],
  ["Aditya Rao", "Vantage Legal LLP", "Bengaluru", "9886134523", "aditya.rao@vantagelegal.in"],
  ["Lakshmi Warrier", "Greenleaf Ayurveda", "Thrissur", "9562145634", "lakshmi@greenleafayur.com"],
  ["Joel Mathew", "Kochi Design Collective", "Kochi", "9895156745", "joel@kochidesign.co"],
  ["Harini Reddy", "Infinity Edtech", "Hyderabad", "9849167856", "harini.reddy@infinityedtech.in"],
] as const;

const ORG_ADDR = ["Infopark Phase II, Kakkanad", "MG Road", "Panampilly Nagar", "Technopark Campus", "Outer Ring Road", "Anna Salai"];

export function defaultSettings(today = new Date()): Settings {
  let maint = addDays(today, 12);
  if (maint.getDay() === 0) maint = addDays(maint, 1);
  return {
    openDays: [false, true, true, true, true, true, true],
    openHour: 8,
    closeHour: 22,
    weekdayRate: 2500,
    weekendRate: 3200,
    minHours: 2,
    maxPax: 80,
    taxRate: 18,
    autoConfirm: true,
    advanceDays: 90,
    blockedDates: [{ date: format(maint, "yyyy-MM-dd"), reason: "Annual AV maintenance" }],
    blockedSlots: { [format(addDays(today, 3), "yyyy-MM-dd")]: [8, 9] },
  };
}

const txn = (r: () => number) =>
  "pay_" + Array.from({ length: 14 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[Math.floor(r() * 56)]).join("");

export function seedBookings(settings: Settings, today = new Date()): Booking[] {
  const r = mulberry32(20261008);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
  const todayStr = format(today, "yyyy-MM-dd");
  const out: Booking[] = [];
  let seq = 1001;

  for (let off = -150; off <= 45; off++) {
    const day = addDays(today, off);
    const date = format(day, "yyyy-MM-dd");
    if (!settings.openDays[day.getDay()] || settings.blockedDates.some((b) => b.date === date)) continue;
    const chance = off < 0 ? 0.62 : off < 14 ? 0.55 : 0.3;
    if (r() > chance) continue;
    const count = r() < 0.35 ? 2 : 1;
    const taken: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      const hours = pick([2, 2, 3, 3, 4, 4, 5, 6, 8]);
      const start = pick([8, 9, 10, 10, 11, 13, 14, 14, 15, 16, 17, 18]);
      const end = start + hours;
      if (end > settings.closeHour) continue;
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      if (settings.blockedSlots[date]?.some((h) => h >= start && h < end)) continue;
      taken.push([start, end]);

      const c = CLIENTS[Math.floor(Math.pow(r(), 1.7) * CLIENTS.length)];
      const online = r() < 0.7;
      const method: PayMethod = online ? pick(["UPI", "UPI", "UPI", "Card", "Card", "Netbanking", "Wallet"] as const) : pick(["Bank Transfer", "Bank Transfer", "Cash"] as const);
      const q = quote(settings, date, hours);
      const created = subDays(day, 2 + Math.floor(r() * 24));
      const createdAt = (created > today ? subDays(today, 1) : created).toISOString();
      const roll = r();
      let status: Booking["status"];
      let pay: Booking["payment"]["status"];
      if (date < todayStr) {
        [status, pay] = roll < 0.9 ? ["completed", "paid"] : ["cancelled", "refunded"];
      } else {
        [status, pay] = roll < 0.74 ? ["confirmed", "paid"] : roll < 0.9 ? ["pending", "pending"] : ["pending", "paid"];
      }
      if (pay === "pending" && online) status = "pending";
      out.push({
        id: `BMC-${seq++}`,
        date, start, hours,
        pax: 10 + Math.floor(r() * (settings.maxPax - 10)),
        purpose: pick(PURPOSES.slice(0, 8)),
        contactName: c[0], organisation: c[1], place: c[2], mobile: c[3], email: c[4],
        orgAddress: `${pick(ORG_ADDR)}, ${c[2]}`,
        gstin: r() < 0.6 ? `32AAB${c[3].slice(-4)}${String.fromCharCode(65 + Math.floor(r() * 26))}1Z${Math.floor(r() * 9)}` : undefined,
        ...q,
        status,
        payment: {
          status: pay,
          method,
          txnId: pay !== "pending" ? (online ? txn(r) : `NEFT${Math.floor(r() * 1e10)}`) : undefined,
          paidAt: pay !== "pending" ? createdAt : undefined,
        },
        source: online ? "online" : "manual",
        createdAt,
        reviewRequested: status === "completed" && r() < 0.5,
      });
    }
  }
  return out;
}

export const SEED_REVIEWS: Review[] = [
  { id: "r1", name: "Meera Thomas", organisation: "Periyar Health Systems", rating: 5, date: "2026-09-21", published: true, text: "We ran a two-day clinical training here. The acoustics are superb, the projector is sharp even with the blinds open, and the host anticipated everything before we asked." },
  { id: "r2", name: "Sanjay Iyer", organisation: "Riverstone Capital", rating: 5, date: "2026-09-14", published: true, text: "Our investor meet felt like a five-star hotel boardroom without the hotel prices. Booking by the hour is exactly what we needed." },
  { id: "r3", name: "Sneha Joseph", organisation: "Monsoon Media House", rating: 5, date: "2026-08-30", published: true, text: "Hosted a press meet with 60 journalists. Wi-Fi held up, the mic setup was flawless and the coffee was genuinely good." },
  { id: "r4", name: "Rahul Varma", organisation: "Nila Software Labs", rating: 4, date: "2026-08-18", published: true, text: "Calm, beautifully lit space with great Zoom Rooms setup for our hybrid all-hands. Parking can get busy on Fridays." },
  { id: "r5", name: "Ananya Krishnan", organisation: "Lumen Learning Academy", rating: 5, date: "2026-08-02", published: true, text: "We now book every month for our workshops. The online booking and instant confirmation save us so much back and forth." },
  { id: "r6", name: "Joel Mathew", organisation: "Kochi Design Collective", rating: 5, date: "2026-07-19", published: true, text: "Exquisite interiors. Our product launch photographs looked incredible against the timber and stone." },
  { id: "r7", name: "Aditya Rao", organisation: "Vantage Legal LLP", rating: 4, date: "2026-07-05", published: true, text: "Professional, discreet and quiet. Ideal for long arbitration sessions. Would love a slightly bigger breakout room." },
  { id: "r8", name: "Harini Reddy", organisation: "Infinity Edtech", rating: 5, date: "2026-06-22", published: true, text: "Flew in from Hyderabad for a leadership offsite. Smooth from booking to invoice. The team made us feel at home." },
  { id: "r9", name: "Nikhil George", organisation: "Tidewave Logistics", rating: 3, date: "2026-06-10", published: false, text: "Good hall, but the AC took a while to cool down for an early 8am slot." },
];

export function seedEmails(bookings: Booking[]): SentEmail[] {
  return bookings
    .filter((b) => b.status === "confirmed")
    .slice(0, 6)
    .map((b, i) => ({
      id: `m${i}`,
      template: "confirmed" as const,
      bookingId: b.id,
      to: b.email,
      subject: fill(DEFAULT_TEMPLATES.confirmed.subject, templateVars(b)),
      sentAt: b.createdAt,
    }));
}
