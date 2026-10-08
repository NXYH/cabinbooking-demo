"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Check } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageHead } from "@/components/admin/sidebar";
import { BookingSheet } from "@/components/admin/booking-sheet";
import { StatusBadge } from "@/components/shared/status";
import { useApp } from "@/lib/store";
import { hourLabel, hoursOfDay, inr, prettyDate, timeRange } from "@/lib/logic";
import { cn } from "@/lib/utils";

const teal: ChartConfig = { value: { label: "Value", color: "var(--chart-1)" } };
const ink: ChartConfig = { value: { label: "Value", color: "var(--chart-2)" } };

export default function Dashboard() {
  const { bookings, settings, setStatus } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");

  const m = useMemo(() => {
    const live = bookings.filter((b) => b.status !== "cancelled");
    const monthKey = (d: Date) => format(d, "yyyy-MM");
    const thisM = monthKey(now), lastM = monthKey(subMonths(now, 1));
    const rev = (k: string) => live.filter((b) => b.date.startsWith(k) && b.payment.status === "paid").reduce((a, b) => a + b.total, 0);
    const cnt = (k: string) => live.filter((b) => b.date.startsWith(k)).length;

    // occupancy over next 30 open days
    let open = 0, booked = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(now, i), ds = format(d, "yyyy-MM-dd");
      if (!settings.openDays[d.getDay()] || settings.blockedDates.some((x) => x.date === ds)) continue;
      open += settings.closeHour - settings.openHour;
      booked += live.filter((b) => b.date === ds).reduce((a, b) => a + b.hours, 0);
    }

    const months = Array.from({ length: 6 }, (_, i) => subMonths(startOfMonth(now), 5 - i)).map((d) => ({ label: format(d, "MMM"), value: rev(monthKey(d)) }));
    const purpose = Object.entries(live.reduce<Record<string, number>>((a, b) => ((a[b.purpose] = (a[b.purpose] ?? 0) + 1), a), {}))
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const hours = hoursOfDay(settings).map((h) => ({ label: hourLabel(h), value: live.filter((b) => h >= b.start && h < b.start + b.hours).length }));
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({ label, value: live.filter((b) => new Date(b.date).getDay() === (i + 1) % 7).length }));
    const paidLive = live.filter((b) => b.payment.status === "paid");

    return {
      revThis: rev(thisM), revLast: rev(lastM), cntThis: cnt(thisM), cntLast: cnt(lastM),
      occupancy: open ? Math.round((booked / open) * 100) : 0,
      avg: paidLive.length ? Math.round(paidLive.reduce((a, b) => a + b.total, 0) / paidLive.length) : 0,
      outstanding: live.filter((b) => b.payment.status === "pending").reduce((a, b) => a + b.total, 0),
      months, purpose, hours, days,
      pending: bookings.filter((b) => b.status === "pending").sort((a, b) => a.date.localeCompare(b.date)),
      upcoming: live.filter((b) => b.date >= today && b.status === "confirmed").sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 6),
    };
  }, [bookings, settings]); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);

  return (
    <>
      <PageHead title="Good day, Anil." sub={`${format(now, "EEEE, d MMMM yyyy")}, Here's how the hall is performing.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue this month" value={inr(m.revThis)} delta={delta(m.revThis, m.revLast)} />
        <Kpi label="Bookings this month" value={String(m.cntThis)} delta={delta(m.cntThis, m.cntLast)} />
        <Kpi label="Occupancy, next 30 days" value={`${m.occupancy}%`} note="Booked hours / open hours" />
        <Kpi label="Average booking value" value={inr(m.avg)} note={`${inr(m.outstanding)} outstanding`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Collected per month, last 6 months (incl. GST)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={teal} className="h-64 w-full">
              <BarChart data={m.months} margin={{ left: 8 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator formatter={(v) => inr(Number(v))} />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings by purpose</CardTitle>
            <CardDescription>All non-cancelled bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ink} className="h-64 w-full">
              <BarChart data={m.purpose} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 11 }} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Peak hours</CardTitle>
            <CardDescription>Number of bookings occupying each hour</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={teal} className="h-52 w-full">
              <BarChart data={m.hours}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={1} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demand by weekday</CardTitle>
            <CardDescription>Total bookings per day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ink} className="h-52 w-full">
              <BarChart data={m.days}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={28} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Awaiting approval</CardTitle>
            <CardDescription>{m.pending.length} pending bookings</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {m.pending.length === 0 && <p className="py-6 text-sm text-muted-foreground">All caught up.</p>}
            {m.pending.slice(0, 6).map((b) => (
              <div key={b.id} className="flex items-center gap-3 py-3">
                <button className="flex-1 text-left" onClick={() => setOpen(b.id)}>
                  <div className="text-sm font-medium">{b.organisation}</div>
                  <div className="text-xs text-muted-foreground">{prettyDate(b.date)}, {timeRange(b.start, b.hours)}, {inr(b.total)}, payment {b.payment.status}</div>
                </button>
                <Button size="sm" variant="outline" onClick={() => { setStatus(b.id, "confirmed"); toast.success(`${b.id} confirmed. Email sent to ${b.email}.`); }}>
                  <Check /> Confirm
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
            <CardDescription>
              Next confirmed events, <Link href="/admin/bookings" className="underline underline-offset-2">all bookings</Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {m.upcoming.map((b) => (
              <button key={b.id} onClick={() => setOpen(b.id)} className="flex w-full items-center gap-4 py-3 text-left">
                <div className="w-12 text-center">
                  <div className="text-[10px] tracking-widest text-muted-foreground uppercase">{format(new Date(b.date), "MMM")}</div>
                  <div className="font-display text-2xl leading-none">{b.date.slice(8)}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{b.organisation}</div>
                  <div className="text-xs text-muted-foreground">{timeRange(b.start, b.hours)}, {b.pax} guests, {b.purpose}</div>
                </div>
                <StatusBadge status={b.status} />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
      <BookingSheet id={open} onClose={() => setOpen(null)} />
    </>
  );
}

function Kpi({ label, value, delta, note }: { label: string; value: string; delta?: number; note?: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 font-display text-3xl tabular-nums">{value}</div>
        {delta !== undefined ? (
          <div className={cn("mt-1 flex items-center gap-1 text-xs", delta >= 0 ? "text-emerald-700" : "text-rose-700")}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta)}% vs last month
          </div>
        ) : (
          <div className="mt-1 text-xs text-muted-foreground">{note}</div>
        )}
      </CardContent>
    </Card>
  );
}
