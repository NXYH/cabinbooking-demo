"use client";
import { addDays, format, parseISO, startOfToday } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useApp } from "@/lib/store";
import { hourLabel, hoursOfDay, rangeFree, slotState, type SlotState } from "@/lib/logic";
import { cn } from "@/lib/utils";

export interface Slot {
  date?: string;
  start?: number;
  hours: number;
}

const STYLE: Record<SlotState, string> = {
  open: "border-border bg-card hover:border-foreground/50",
  booked: "border-transparent bg-muted text-muted-foreground/60 line-through cursor-not-allowed",
  blocked: "border-dashed border-border bg-transparent text-muted-foreground/50 cursor-not-allowed",
  closed: "hidden",
  past: "border-transparent bg-muted/60 text-muted-foreground/40 cursor-not-allowed",
};

export function SlotPicker({ value, onChange, ignoreId }: { value: Slot; onChange: (v: Slot) => void; ignoreId?: string }) {
  const { settings, bookings } = useApp();
  const today = startOfToday();

  const pick = (h: number) => {
    const { date, start, hours } = value;
    if (!date) return;
    const free = (s: number, n: number) => rangeFree(settings, bookings, date, s, n, ignoreId);
    if (start === undefined || h < start || (h >= start + hours && !free(start, h - start + 1))) {
      onChange({ date, start: h, hours: free(h, settings.minHours) ? settings.minHours : 1 });
    } else {
      onChange({ date, start, hours: h - start + 1 });
    }
  };

  const hours = hoursOfDay(settings);
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <div className="flex justify-center md:block">
      <Calendar
        mode="single"
        selected={value.date ? parseISO(value.date) : undefined}
        onSelect={(d) => d && onChange({ date: format(d, "yyyy-MM-dd"), start: undefined, hours: settings.minHours })}
        disabled={[
          { before: today },
          { after: addDays(today, settings.advanceDays) },
          (d) => !settings.openDays[d.getDay()],
          (d) => settings.blockedDates.some((b) => b.date === format(d, "yyyy-MM-dd")),
        ]}
        className="rounded-xl border bg-card p-3 [--cell-size:--spacing(9)]"
      />
      </div>
      <div>
        {!value.date ? (
          <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Select a date to see open hours.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {hours.map((h) => {
                const st = slotState(settings, bookings, value.date!, h, ignoreId);
                const selected = value.start !== undefined && h >= value.start && h < value.start + value.hours;
                return (
                  <button
                    type="button"
                    key={h}
                    disabled={st !== "open"}
                    onClick={() => pick(h)}
                    className={cn(
                      "h-11 rounded-lg border text-sm tabular-nums transition-all",
                      STYLE[st],
                      selected && "border-foreground bg-foreground text-background hover:border-foreground",
                    )}
                    title={st === "open" ? `Book from ${hourLabel(h)}` : st}
                  >
                    {hourLabel(h)}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Legend className="border bg-card" label="Available" />
              <Legend className="bg-foreground" label="Selected" />
              <Legend className="bg-muted" label="Booked" />
              <Legend className="border border-dashed" label="Unavailable" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Tap a start time, then tap the last hour you need.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-sm", className)} />
      {label}
    </span>
  );
}
