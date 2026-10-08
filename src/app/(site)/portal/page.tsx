"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, FileText, LogOut, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PayBadge, StatusBadge } from "@/components/shared/status";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { deriveClients, inr, normMobile, prettyDate, timeRange, validMobile } from "@/lib/logic";
import { downloadIcs } from "@/lib/ics";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PortalPage() {
  return (
    <Suspense>
      <Portal />
    </Suspense>
  );
}


function Portal() {
  const params = useSearchParams();
  const { bookings, setStatus, hydrated } = useApp();
  const [input, setInput] = useState("");
  const [mobile, setMobile] = useState<string | null>(() => {
    const m = params.get("m");
    return m && validMobile(m) ? normMobile(m) : null;
  });
  const [cancelling, setCancelling] = useState<Booking | null>(null);


  const client = mobile ? deriveClients(bookings).find((c) => c.mobile === mobile) : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = client?.bookings.filter((b) => b.date >= today && b.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date)) ?? [];
  const past = client?.bookings.filter((b) => !upcoming.includes(b)).sort((a, b) => b.date.localeCompare(a.date)) ?? [];

  if (!mobile || (hydrated && !client))
    return (
      <div className="mx-auto max-w-md px-5 pt-36 pb-32 md:pt-44">
        <h1 className="font-display text-5xl">My bookings</h1>
        <p className="mt-4 text-muted-foreground">Enter the mobile number you booked with to view your history, invoices and upcoming events.</p>
        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validMobile(input)) return toast.error("Enter a valid 10-digit mobile number.");
            const m = normMobile(input);
            if (!deriveClients(bookings).some((c) => c.mobile === m)) return toast.error("No bookings found for this number.");
            setMobile(m);
            toast.success("Welcome back.");
          }}
        >
          <div className="flex">
            <span className="flex h-12 items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+91</span>
            <Input className="h-12 rounded-l-none" inputMode="numeric" maxLength={10} placeholder="Mobile number" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>
          <Button type="submit" size="lg" className="h-12 w-full">View my bookings</Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Demo: try{" "}
            <button type="button" className="underline underline-offset-2" onClick={() => setInput("9847012301")}>9847012301</button>
          </p>
        </form>
      </div>
    );

  if (!client) return <div className="min-h-[60vh]" />;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-32 pb-24 md:px-8 md:pt-40">
      <div className="flex flex-col justify-between gap-6 border-b pb-10 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-5xl">Hello, {client.name.split(" ")[0]}</h1>
          <p className="mt-2 text-muted-foreground">{client.organisation}, {client.place}, +91 {client.mobile}</p>
        </div>
        <div className="flex gap-8">
          <Stat k="Bookings" v={String(client.bookings.length)} />
          <Stat k="Hours hosted" v={String(client.bookings.filter((b) => b.status !== "cancelled").reduce((a, b) => a + b.hours, 0))} />
          <Stat k="Total spend" v={inr(client.spend)} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Link href="/book" className={cn(buttonVariants(), "h-10 px-5")}>New booking</Link>
        <Button variant="ghost" className="h-10" onClick={() => { setMobile(null); setInput(""); }}>
          <LogOut /> Sign out
        </Button>
      </div>

      <Group title="Upcoming" list={upcoming} empty="No upcoming bookings." onCancel={setCancelling} />
      <Group title="History" list={past} empty="No past bookings yet." />

      <Dialog open={!!cancelling} onOpenChange={(o) => !o && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking {cancelling?.id}?</DialogTitle>
            <DialogDescription>
              {cancelling && `${prettyDate(cancelling.date)}, ${timeRange(cancelling.start, cancelling.hours)}. `}
              Any amount paid will be refunded to the original payment method within 5–7 working days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelling(null)}>Keep booking</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setStatus(cancelling!.id, "cancelled");
                toast.success("Booking cancelled. A confirmation email is on its way.");
                setCancelling(null);
              }}
            >
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div>
    <div className="eyebrow">{k}</div>
    <div className="mt-1 font-display text-3xl">{v}</div>
  </div>
);

function Group({ title, list, empty, onCancel }: { title: string; list: Booking[]; empty: string; onCancel?: (b: Booking) => void }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-3xl">{title}</h2>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-5 divide-y rounded-2xl border bg-card">
          {list.map((b) => (
            <div key={b.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
              <div className="w-20 shrink-0 text-center md:border-r md:pr-5">
                <div className="eyebrow">{new Date(b.date).toLocaleString("en-IN", { month: "short" })}</div>
                <div className="font-display text-4xl leading-none">{b.date.slice(8)}</div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{b.purpose}</span>
                  <StatusBadge status={b.status} />
                  {b.payment.status !== "paid" && <PayBadge status={b.payment.status} />}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {timeRange(b.start, b.hours)}, {b.pax} guests, {inr(b.total)}, <span className="tabular-nums text-xs">{b.id}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Link href={`/invoice/${b.id}`} target="_blank" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <FileText /> Invoice
                </Link>
                {onCancel ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => downloadIcs(b)}><CalendarPlus /> Calendar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onCancel(b)}>Cancel</Button>
                  </>
                ) : (
                  b.status === "completed" && (
                    <Link href={`/reviews?booking=${b.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      <Star /> Review
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
