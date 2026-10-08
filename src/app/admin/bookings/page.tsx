"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHead } from "@/components/admin/sidebar";
import { BookingDialog } from "@/components/admin/booking-dialog";
import { BookingSheet } from "@/components/admin/booking-sheet";
import { PayBadge, StatusBadge } from "@/components/shared/status";
import { useApp } from "@/lib/store";
import { inr, prettyDate, timeRange } from "@/lib/logic";
import type { Booking } from "@/lib/types";

const PER = 12;
type Filter = "all" | "upcoming" | Booking["status"];

export default function BookingsPage() {
  const { bookings, setStatus } = useApp();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Booking | undefined>();
  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bookings
      .filter((b) => (filter === "all" ? true : filter === "upcoming" ? b.date >= today && b.status !== "cancelled" : b.status === filter))
      .filter((b) => !s || [b.id, b.contactName, b.organisation, b.mobile, b.email, b.purpose].some((x) => x.toLowerCase().includes(s)))
      .sort((a, b) => (filter === "upcoming" || filter === "pending" ? 1 : -1) * (a.date + a.start).localeCompare(b.date + b.start));
  }, [bookings, filter, q, today]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice(page * PER, page * PER + PER);
  const count = (f: Filter) => (f === "upcoming" ? bookings.filter((b) => b.date >= today && b.status !== "cancelled").length : f === "all" ? bookings.length : bookings.filter((b) => b.status === f).length);

  const exportCsv = () => {
    const head = ["id", "date", "start", "hours", "pax", "purpose", "contact", "mobile", "email", "place", "organisation", "gstin", "total", "status", "payment", "method"];
    const lines = rows.map((b) => [b.id, b.date, b.start, b.hours, b.pax, b.purpose, b.contactName, b.mobile, b.email, b.place, b.organisation, b.gstin ?? "", b.total, b.status, b.payment.status, b.payment.method].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    a.download = `bookings-${filter}.csv`;
    a.click();
  };

  return (
    <>
      <PageHead title="Bookings" sub="Confirm, modify and record bookings. Click a row for full details.">
        <Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>
        <Button onClick={() => setCreating(true)}><Plus /> Manual booking</Button>
      </PageHead>

      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <Tabs value={filter} onValueChange={(v) => { setFilter(v as Filter); setPage(0); }}>
          <TabsList className="h-9! flex-wrap">
            {(["upcoming", "pending", "confirmed", "completed", "cancelled", "all"] as Filter[]).map((f) => (
              <TabsTrigger key={f} value={f} className="capitalize">
                {f} <span className="ml-1 text-[10px] text-muted-foreground">{count(f)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative lg:w-80">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-9" placeholder="Search name, org, mobile, ID…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Booking</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date & time</TableHead>
              <TableHead className="text-right">Guests</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.length === 0 && (
              <TableRow><TableCell colSpan={8} className="py-16 text-center text-muted-foreground">No bookings match.</TableCell></TableRow>
            )}
            {view.map((b) => (
              <TableRow key={b.id} className="cursor-pointer" onClick={() => setOpen(b.id)}>
                <TableCell className="pl-5">
                  <div className="tabular-nums text-xs">{b.id}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{b.source}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{b.organisation}</div>
                  <div className="text-xs text-muted-foreground">{b.contactName}, {b.mobile}</div>
                </TableCell>
                <TableCell>
                  <div>{prettyDate(b.date)}</div>
                  <div className="text-xs text-muted-foreground">{timeRange(b.start, b.hours)}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{b.pax}</TableCell>
                <TableCell className="text-right tabular-nums">{inr(b.total)}</TableCell>
                <TableCell><PayBadge status={b.payment.status} /></TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {b.status === "pending" && (
                      <Button size="icon-sm" variant="outline" title="Confirm" onClick={() => { setStatus(b.id, "confirmed"); toast.success(`${b.id} confirmed. Email sent.`); }}>
                        <Check />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label="Actions" />}><MoreHorizontal /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setOpen(b.id)}>View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(b)}>Modify booking</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/invoice/${b.id}`, "_blank")}>Open invoice</DropdownMenuItem>
                        {b.status !== "cancelled" && b.status !== "completed" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => { setStatus(b.id, "cancelled"); toast.success(`${b.id} cancelled.`); }}>Cancel booking</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
          <span>{rows.length} bookings</span>
          <div className="flex items-center gap-2">
            <span>Page {page + 1} of {pages}</span>
            <Button size="icon-sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous"><ChevronLeft /></Button>
            <Button size="icon-sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next"><ChevronRight /></Button>
          </div>
        </div>
      </Card>

      <BookingSheet id={open} onClose={() => setOpen(null)} />
      <BookingDialog open={creating} onOpenChange={setCreating} />
      <BookingDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} booking={editing} />
    </>
  );
}
