"use client";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHead } from "@/components/admin/sidebar";
import { useApp } from "@/lib/store";
import { hourLabel, hoursOfDay, prettyDate, slotState } from "@/lib/logic";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityPage() {
  const { settings, bookings, updateSettings, toggleSlot, toggleDate } = useApp();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  const blockedDay = settings.blockedDates.find((b) => b.date === date);
  const closedDay = !settings.openDays[parseISO(date).getDay()];
  const bookedDates = new Set(bookings.filter((b) => b.status !== "cancelled").map((b) => b.date));

  return (
    <>
      <PageHead title="Slots & availability" sub="Set when the hall can be booked. Changes apply to the website immediately." />
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Weekly schedule</CardTitle>
            <CardDescription>Open days and operating hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="divide-y rounded-lg border">
              {DAYS.map((d, i) => (
                <label key={d} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  {d}
                  <Switch
                    checked={settings.openDays[i]}
                    onCheckedChange={(c) => {
                      updateSettings({ openDays: settings.openDays.map((v, j) => (j === i ? !!c : v)) });
                      toast.success(`${d}s are now ${c ? "open" : "closed"} for booking.`);
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <HourSelect label="Opens at" value={settings.openHour} range={[5, settings.closeHour - 1]} onChange={(v) => updateSettings({ openHour: v })} />
              <HourSelect label="Closes at" value={settings.closeHour} range={[settings.openHour + 1, 24]} onChange={(v) => updateSettings({ closeHour: v })} />
            </div>
            <div>
              <Label className="mb-1.5 text-xs text-muted-foreground">Bookable up to (days ahead)</Label>
              <Input type="number" min={7} max={365} value={settings.advanceDays} onChange={(e) => updateSettings({ advanceDays: Math.max(1, Number(e.target.value)) })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily slots</CardTitle>
            <CardDescription>Pick a date to open or block individual hours, or close the whole day.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[auto_1fr]">
            <div>
              <Calendar
                mode="single"
                selected={parseISO(date)}
                onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                modifiers={{
                  booked: (d) => bookedDates.has(format(d, "yyyy-MM-dd")),
                  blocked: (d) => settings.blockedDates.some((b) => b.date === format(d, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  booked: "[&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:size-1 [&_button]:after:rounded-full [&_button]:after:bg-brand",
                  blocked: "[&_button]:line-through [&_button]:text-destructive",
                }}
                className="rounded-xl border [--cell-size:--spacing(9)]"
              />
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-brand" /> Has bookings</span>
                <span className="flex items-center gap-1.5"><span className="text-destructive line-through">12</span> Day blocked</span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-display text-2xl">{prettyDate(date)}</div>
                {closedDay && <span className="text-sm text-muted-foreground">Closed by weekly schedule</span>}
              </div>

              {blockedDay ? (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed p-4 text-sm">
                  <span className="flex items-center gap-2"><Lock className="size-4" /> Whole day blocked: {blockedDay.reason}</span>
                  <Button size="sm" variant="outline" onClick={() => { toggleDate(date); toast.success("Day reopened for booking."); }}>Reopen day</Button>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {hoursOfDay(settings).map((h) => {
                      const st = slotState(settings, bookings, date, h, undefined, new Date(0));
                      const b = bookings.find((x) => x.status !== "cancelled" && x.date === date && h >= x.start && h < x.start + x.hours);
                      return (
                        <button
                          key={h}
                          disabled={st === "booked" || st === "closed"}
                          onClick={() => toggleSlot(date, h)}
                          title={b ? `${b.id}, ${b.organisation}` : st === "blocked" ? "Click to open" : "Click to block"}
                          className={cn(
                            "h-14 rounded-lg border px-2 text-left text-xs transition",
                            st === "open" && "bg-card hover:border-foreground/50",
                            st === "blocked" && "border-dashed bg-muted/50 text-muted-foreground",
                            st === "booked" && "border-brand/30 bg-brand-soft cursor-default",
                            st === "closed" && "opacity-40",
                          )}
                        >
                          <div className="font-medium tabular-nums">{hourLabel(h)}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{b ? b.organisation : st === "blocked" ? "Blocked" : st === "closed" ? "Closed" : "Open"}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Input placeholder="Reason, e.g. Private event, Maintenance" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (bookedDates.has(date)) return toast.error("This day has bookings. Cancel or move them before blocking the whole day.");
                        toggleDate(date, reason || "Blocked by admin");
                        setReason("");
                        toast.success(`${prettyDate(date)} blocked.`);
                      }}
                    >
                      <Lock /> Block whole day
                    </Button>
                  </div>
                </>
              )}

              <div className="mt-8">
                <div className="eyebrow mb-3">Blocked dates</div>
                <div className="flex flex-wrap gap-2">
                  {settings.blockedDates.length === 0 && <span className="text-sm text-muted-foreground">None.</span>}
                  {settings.blockedDates.map((b) => (
                    <span key={b.date} className="flex items-center gap-2 rounded-full border py-1 pr-1.5 pl-3 text-xs">
                      <button onClick={() => setDate(b.date)}>{prettyDate(b.date)}, {b.reason}</button>
                      <button onClick={() => toggleDate(b.date)} aria-label="Remove" className="rounded-full p-0.5 hover:bg-muted"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function HourSelect({ label, value, range, onChange }: { label: string; value: number; range: [number, number]; onChange: (v: number) => void }) {
  const opts = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i);
  return (
    <div>
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="w-full"><SelectValue>{(v: string) => hourLabel(Number(v))}</SelectValue></SelectTrigger>
        <SelectContent>{opts.map((h) => <SelectItem key={h} value={String(h)}>{hourLabel(h)}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
