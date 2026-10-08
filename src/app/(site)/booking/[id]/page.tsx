"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarPlus, FileText, Mail, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status";
import { EmailFrame } from "@/components/shared/email-frame";
import { useApp } from "@/lib/store";
import { inr, prettyDate, timeRange } from "@/lib/logic";
import { downloadIcs } from "@/lib/ics";
import { cn } from "@/lib/utils";

export default function BookingDone() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useApp((s) => s.hydrated);
  const b = useApp((s) => s.bookings.find((x) => x.id === id));
  const mail = useApp((s) => s.outbox.find((m) => m.bookingId === id && (m.template === "confirmed" || m.template === "received")));

  if (!b)
    return (
      <div className="mx-auto max-w-xl px-5 pt-40 pb-32 text-center">
        {hydrated && (
          <>
            <h1 className="font-display text-4xl">Booking not found</h1>
            <p className="mt-3 text-muted-foreground">Look it up from the client portal with your mobile number.</p>
            <Link href="/portal" className={cn(buttonVariants(), "mt-6 px-6")}>Open client portal</Link>
          </>
        )}
      </div>
    );

  const confirmed = b.status === "confirmed" || b.status === "completed";
  return (
    <div className="mx-auto max-w-6xl px-5 pt-32 pb-24 md:px-8 md:pt-40">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="flex size-14 items-center justify-center rounded-full bg-brand"
          >
            <svg viewBox="0 0 52 52" className="size-8">
              <motion.path d="M14 27 l8 8 l16 -18" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
            </svg>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="eyebrow mt-8">{confirmed ? "Booking confirmed" : "Request received"}</div>
            <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">
              {confirmed ? `You're booked, ${b.contactName.split(" ")[0]}.` : `Thanks, ${b.contactName.split(" ")[0]}. We have your request.`}
            </h1>
            <p className="mt-5 text-muted-foreground">
              {confirmed
                ? "Your payment was successful and the hall is reserved. A confirmation and GST invoice have been emailed to "
                : "Your payment was received. Our team will confirm the booking shortly. We have emailed a receipt to "}
              <span className="text-foreground">{b.email}</span>.
            </p>
          </motion.div>

          <div className="mt-10 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="tabular-nums text-sm">{b.id}</span>
              <StatusBadge status={b.status} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ["Date", prettyDate(b.date)],
                ["Time", timeRange(b.start, b.hours)],
                ["Guests", String(b.pax)],
                ["Purpose", b.purpose],
                ["Organisation", b.organisation],
                ["Paid", `${inr(b.total)}, ${b.payment.method}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 tabular-nums text-[11px] text-muted-foreground">Txn {b.payment.txnId}</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/invoice/${b.id}`} target="_blank" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5")}>
              <FileText /> Invoice
            </Link>
            <Button variant="outline" className="h-10 px-5" onClick={() => downloadIcs(b)}>
              <CalendarPlus /> Add to calendar
            </Button>
            <Link href={`/portal?m=${b.mobile}`} className={cn(buttonVariants({ variant: "outline" }), "h-10 px-5")}>
              <UserRound /> My bookings
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" /> Email sent to {b.email}
            {mail && <span className="truncate">: {mail.subject}</span>}
          </div>
          <EmailFrame booking={b} template={confirmed ? "confirmed" : "received"} />
        </div>
      </div>
    </div>
  );
}
