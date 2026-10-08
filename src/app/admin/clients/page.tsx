"use client";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHead } from "@/components/admin/sidebar";
import { BookingSheet } from "@/components/admin/booking-sheet";
import { BookingDialog } from "@/components/admin/booking-dialog";
import { PayBadge, StatusBadge } from "@/components/shared/status";
import { useApp } from "@/lib/store";
import { deriveClients, inr, prettyDate, timeRange } from "@/lib/logic";

export default function ClientsPage() {
  const bookings = useApp((s) => s.bookings);
  const clients = useMemo(() => deriveClients(bookings), [bookings]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const c = clients.find((x) => x.mobile === sel);
  const s = q.toLowerCase();
  const rows = clients.filter((x) => !s || [x.name, x.organisation, x.mobile, x.email, x.place].some((v) => v.toLowerCase().includes(s)));

  return (
    <>
      <PageHead title="Clients" sub={`${clients.length} clients, built from every booking, keyed by mobile number`}>
        <Button onClick={() => setCreating(true)}><Plus /> Add booking</Button>
      </PageHead>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-9 pl-9" placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Client</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Place</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Lifetime spend</TableHead>
              <TableHead className="pr-5 text-right">Last booking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((x) => (
              <TableRow key={x.mobile} className="cursor-pointer" onClick={() => setSel(x.mobile)}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-brand-soft font-display text-sm">{x.name.split(" ").map((p) => p[0]).join("")}</div>
                    <div>
                      <div className="font-medium">{x.name}</div>
                      <div className="text-xs text-muted-foreground">+91 {x.mobile}, {x.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{x.organisation}</TableCell>
                <TableCell>{x.place}</TableCell>
                <TableCell className="text-right tabular-nums">{x.bookings.length}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(x.spend)}</TableCell>
                <TableCell className="pr-5 text-right">{prettyDate(x.lastDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!c} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {c && (
            <>
              <SheetHeader className="border-b p-6">
                <SheetTitle className="font-display text-3xl">{c.name}</SheetTitle>
                <SheetDescription>{c.organisation}, {c.place}<br />+91 {c.mobile}, {c.email}</SheetDescription>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ["Bookings", String(c.bookings.length)],
                    ["Hours", String(c.bookings.filter((b) => b.status !== "cancelled").reduce((a, b) => a + b.hours, 0))],
                    ["Spend", inr(c.spend)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border p-3">
                      <div className="text-[10px] tracking-widest text-muted-foreground uppercase">{k}</div>
                      <div className="font-display text-2xl">{v}</div>
                    </div>
                  ))}
                </div>
              </SheetHeader>
              <div className="px-6 pb-8">
                <div className="eyebrow mb-3">Booking history</div>
                <ol className="relative space-y-4 border-l pl-5">
                  {[...c.bookings].sort((a, b) => b.date.localeCompare(a.date)).map((b) => (
                    <li key={b.id} className="relative">
                      <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-brand" />
                      <button className="w-full rounded-lg border p-3 text-left transition hover:bg-muted/50" onClick={() => setBooking(b.id)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{prettyDate(b.date)}</span>
                          <StatusBadge status={b.status} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{timeRange(b.start, b.hours)}, {b.purpose}, {b.pax} pax</span>
                          <span className="flex items-center gap-2">{inr(b.total)} <PayBadge status={b.payment.status} /></span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <BookingSheet id={booking} onClose={() => setBooking(null)} />
      <BookingDialog open={creating} onOpenChange={setCreating} />
    </>
  );
}
