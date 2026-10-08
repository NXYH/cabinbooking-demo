// Run: node --experimental-strip-types scripts/check-logic.ts
import assert from "node:assert/strict";
import { quote, slotState, rangeFree } from "../src/lib/logic.ts";
import type { Booking, Settings } from "../src/lib/types.ts";

const s: Settings = {
  openDays: [false, true, true, true, true, true, true], openHour: 8, closeHour: 22,
  weekdayRate: 2500, weekendRate: 3200, minHours: 2, maxPax: 80, taxRate: 18,
  autoConfirm: true, advanceDays: 90, blockedDates: [{ date: "2030-01-08", reason: "x" }], blockedSlots: { "2030-01-09": [10] },
};
const b = { id: "A", date: "2030-01-07", start: 10, hours: 3, status: "confirmed" } as Booking;
const now = new Date("2029-12-01T00:00:00");

assert.deepEqual(quote(s, "2030-01-07", 3), { rate: 2500, subtotal: 7500, tax: 1350, total: 8850 }); // Monday
assert.equal(quote(s, "2030-01-05", 2).rate, 3200); // Saturday
assert.equal(slotState(s, [b], "2030-01-07", 12, undefined, now), "booked");
assert.equal(slotState(s, [b], "2030-01-07", 13, undefined, now), "open"); // end is exclusive
assert.equal(slotState(s, [b], "2030-01-07", 12, "A", now), "open"); // editing frees own slots
assert.equal(slotState(s, [{ ...b, status: "cancelled" }], "2030-01-07", 11, undefined, now), "open");
assert.equal(slotState(s, [], "2030-01-06", 12, undefined, now), "closed"); // Sunday off
assert.equal(slotState(s, [], "2030-01-07", 22, undefined, now), "closed");
assert.equal(slotState(s, [], "2030-01-08", 12, undefined, now), "blocked");
assert.equal(slotState(s, [], "2030-01-09", 10, undefined, now), "blocked");
assert.equal(rangeFree(s, [b], "2030-01-07", 8, 2), true);
assert.equal(rangeFree(s, [b], "2030-01-07", 8, 3), false);
console.log("logic ok");
