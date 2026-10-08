"use client";
import { addDays, format } from "date-fns";
import { useApp } from "@/lib/store";
import { hourLabel, hoursOfDay, inr, rangeFree, rateFor } from "@/lib/logic";

/** First bookable block from now, read from live availability. */
export function NextSlot() {
  const { settings, bookings, hydrated } = useApp();
  if (!hydrated) return <div className="h-12" />;
  for (let i = 0; i < settings.advanceDays; i++) {
    const day = addDays(new Date(), i);
    const date = format(day, "yyyy-MM-dd");
    const h = hoursOfDay(settings).find((h) => rangeFree(settings, bookings, date, h, settings.minHours));
    if (h === undefined) continue;
    const when = i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(day, "EEE d MMM");
    return (
      <div className="text-sm leading-snug text-white/85">
        <div className="text-white/60">Next available</div>
        <div className="mt-0.5 text-base font-medium text-white">
          {when}, from {hourLabel(h)}
        </div>
        <div className="text-white/60">{inr(rateFor(settings, date))} per hour</div>
      </div>
    );
  }
  return null;
}

export function SpecTable() {
  const s = useApp((x) => x.settings);
  const rows: [string, string][] = [
    ["Floor area", "2,400 sq ft, column free"],
    ["Capacity", `Up to ${s.maxPax} guests theatre style`],
    ["Ceiling", "14 ft, acoustic timber"],
    ["Hours", `${hourLabel(s.openHour)} to ${hourLabel(s.closeHour)}, Monday to Saturday`],
    ["Weekday rate", `${inr(s.weekdayRate)} per hour`],
    ["Weekend rate", `${inr(s.weekendRate)} per hour`],
    ["Minimum booking", `${s.minHours} hours, plus ${s.taxRate}% GST`],
  ];
  return (
    <dl className="divide-y border-y">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3.5 text-[0.95rem] sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted-foreground">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
