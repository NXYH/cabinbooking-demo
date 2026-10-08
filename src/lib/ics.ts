import type { Booking } from "./types";
import { VENUE } from "./venue";

export function downloadIcs(b: Booking) {
  const stamp = (h: number) => `${b.date.replaceAll("-", "")}T${String(h).padStart(2, "0")}0000`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Cabin//Booking//EN", "BEGIN:VEVENT",
    `UID:${b.id}@thecabin.in`, `DTSTART;TZID=Asia/Kolkata:${stamp(b.start)}`, `DTEND;TZID=Asia/Kolkata:${stamp(b.start + b.hours)}`,
    `SUMMARY:${b.purpose} · ${VENUE.name}`, `LOCATION:${VENUE.address.replaceAll(",", "\\,")}`, `DESCRIPTION:Booking ${b.id} for ${b.pax} guests`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `${b.id}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
