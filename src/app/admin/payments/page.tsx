"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHead } from "@/components/admin/sidebar";
import { BookingSheet } from "@/components/admin/booking-sheet";
import { PayBadge } from "@/components/shared/status";
import { useApp } from "@/lib/store";
import { inr, prettyDate } from "@/lib/logic";

const cfg: ChartConfig = { value: { label: "Collected", color: "var(--chart-1)" } };

export default function PaymentsPage() {
  const { bookings, markPaid } = useApp();
  const [tab, setTab] = useState("all");
  const [open, setOpen] = useState<string | null>(null);

  const s = useMemo(() => {
    const sum = (f: (b: (typeof bookings)[0]) => boolean) => bookings.filter(f).reduce((a, b) => a + b.total, 0);
    const paid = bookings.filter((b) => b.payment.status === "paid");
    const methods = Object.entries(paid.reduce<Record<string, number>>((a, b) => ((a[b.payment.method] = (a[b.payment.method] ?? 0) + b.total), a), {}))
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    return {
      collected: sum((b) => b.payment.status === "paid"),
      gst: paid.reduce((a, b) => a + b.tax, 0),
      pending: sum((b) => b.payment.status === "pending" && b.status !== "cancelled"),
      refunded: sum((b) => b.payment.status === "refunded"),
      methods,
    };
  }, [bookings]);

  const rows = bookings
    .filter((b) => tab === "all" || b.payment.status === tab)
    .sort((a, b) => (b.payment.paidAt ?? b.createdAt).localeCompare(a.payment.paidAt ?? a.createdAt))
    .slice(0, 60);

  return (
    <>
      <PageHead title="Payments" sub="Transactions, outstanding dues and refunds." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total collected", inr(s.collected)],
          ["GST collected", inr(s.gst)],
          ["Outstanding", inr(s.pending)],
          ["Refunded", inr(s.refunded)],
        ].map(([k, v]) => (
          <Card key={k}>
            <CardContent>
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className="mt-2 font-display text-4xl">{v}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(0,9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>By payment method</CardTitle>
            <CardDescription>Amount collected per method</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cfg} className="h-72 w-full">
              <BarChart data={s.methods} layout="vertical" margin={{ right: 16 }}>
                <CartesianGrid horizontal={false} strokeOpacity={0.5} />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={96} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator formatter={(v) => inr(Number(v))} />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="pb-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
              <TabsList>
                {["all", "paid", "pending", "refunded"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpen(b.id)}>
                    <TableCell className="pl-6">
                      <div className="tabular-nums text-xs">{b.payment.txnId ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{b.id}</div>
                    </TableCell>
                    <TableCell>{b.organisation}</TableCell>
                    <TableCell>{b.payment.method}</TableCell>
                    <TableCell>{b.payment.paidAt ? prettyDate(b.payment.paidAt.slice(0, 10)) : <span className="text-muted-foreground">Due {prettyDate(b.date)}</span>}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(b.total)}</TableCell>
                    <TableCell className="pr-6" onClick={(e) => e.stopPropagation()}>
                      {b.payment.status === "pending" && b.status !== "cancelled" ? (
                        <Button size="xs" variant="outline" onClick={() => { markPaid(b.id, b.payment.method); toast.success(`${inr(b.total)} marked as received.`); }}>
                          Mark paid
                        </Button>
                      ) : (
                        <PayBadge status={b.payment.status} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <BookingSheet id={open} onClose={() => setOpen(null)} />
    </>
  );
}
