"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Ban, Check, FileText, IndianRupee, Mail, Pencil, Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PayBadge, StatusBadge } from "@/components/shared/status";
import { EmailFrame } from "@/components/shared/email-frame";
import { BookingDialog } from "./booking-dialog";
import { useApp } from "@/lib/store";
import { inr, prettyDate, timeRange } from "@/lib/logic";
import type { PayMethod, SentEmail } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BookingSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { bookings, outbox, templates, setStatus, markPaid, sendEmail } = useApp();
  const b = bookings.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<SentEmail | null>(null);
  const mails = outbox.filter((m) => m.bookingId === id);
  const history = b ? bookings.filter((x) => x.mobile === b.mobile && x.id !== b.id).sort((a, c) => c.date.localeCompare(a.date)) : [];

  return (
    <>
      <Sheet open={!!b} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {b && (
            <>
              <SheetHeader className="border-b p-6">
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-xs text-muted-foreground">{b.id}</span>
                  <StatusBadge status={b.status} />
                  <span className="text-xs text-muted-foreground capitalize">· {b.source}</span>
                </div>
                <SheetTitle className="font-display text-3xl">{b.organisation}</SheetTitle>
                <SheetDescription>{prettyDate(b.date)}, {timeRange(b.start, b.hours)}, {b.hours} hrs</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-6 pb-8">
                <div className="flex flex-wrap gap-2">
                  {b.status === "pending" && (
                    <Button size="sm" onClick={() => { setStatus(b.id, "confirmed"); toast.success(`${b.id} confirmed. Confirmation email sent to ${b.email}.`); }}>
                      <Check /> Confirm booking
                    </Button>
                  )}
                  {b.payment.status === "pending" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}><IndianRupee /> Record payment</DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["Bank Transfer", "Cash", "UPI", "Card"] as PayMethod[]).map((m) => (
                          <DropdownMenuItem key={m} onClick={() => { markPaid(b.id, m); toast.success(`Payment of ${inr(b.total)} recorded via ${m}.`); }}>{m}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil /> Modify</Button>
                  <Link href={`/invoice/${b.id}`} target="_blank" className={buttonVariants({ size: "sm", variant: "outline" })}><FileText /> Invoice</Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}><Mail /> Send email</DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {(["confirmed", "invoice", "review", "received"] as const).map((k) => (
                        <DropdownMenuItem key={k} onClick={() => { sendEmail(k, b.id); toast.success(`“${templates[k].name}” sent to ${b.email}.`); }}>{templates[k].name}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {b.status === "completed" && !b.reviewRequested && (
                    <Button size="sm" variant="outline" onClick={() => { sendEmail("review", b.id); toast.success("Review request sent."); }}><Star /> Ask for review</Button>
                  )}
                  {b.status !== "cancelled" && b.status !== "completed" && (
                    <Button size="sm" variant="destructive" onClick={() => { setStatus(b.id, "cancelled"); toast.success(`${b.id} cancelled${b.payment.status === "paid" ? " and refund initiated" : ""}.`); }}>
                      <Ban /> Cancel
                    </Button>
                  )}
                </div>

                <Block title="Event">
                  <KV k="Guests" v={String(b.pax)} />
                  <KV k="Purpose" v={b.purpose} />
                  {b.notes && <KV k="Notes" v={b.notes} />}
                  <KV k="Booked on" v={new Date(b.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
                </Block>
                <Block title="Contact">
                  <KV k="Name" v={b.contactName} />
                  <KV k="Mobile" v={`+91 ${b.mobile}`} />
                  <KV k="Email" v={b.email} />
                  <KV k="Place" v={b.place} />
                </Block>
                <Block title="Organisation">
                  <KV k="Name" v={b.organisation} />
                  {b.orgAddress && <KV k="Address" v={b.orgAddress} />}
                  <KV k="GSTIN" v={b.gstin ?? "—"} />
                </Block>
                <Block title="Payment">
                  <KV k="Subtotal" v={inr(b.subtotal)} />
                  <KV k="GST" v={inr(b.tax)} />
                  <KV k="Total" v={<span className="font-medium">{inr(b.total)}</span>} />
                  <KV k="Status" v={<PayBadge status={b.payment.status} />} />
                  <KV k="Method" v={b.payment.method} />
                  {b.payment.txnId && <KV k="Txn ID" v={<span className="tabular-nums text-xs">{b.payment.txnId}</span>} />}
                </Block>

                <Block title={`Emails (${mails.length})`}>
                  {mails.length === 0 && <p className="text-sm text-muted-foreground">No emails sent yet.</p>}
                  {mails.map((m) => (
                    <button key={m.id} onClick={() => setPreview(m)} className="flex w-full items-center justify-between gap-3 rounded-md py-1.5 text-left text-sm hover:text-foreground">
                      <span className="truncate">{m.subject}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{new Date(m.sentAt).toLocaleDateString("en-IN")}</span>
                    </button>
                  ))}
                </Block>

                <Block title={`Client history (${history.length} other)`}>
                  {history.length === 0 && <p className="text-sm text-muted-foreground">First booking from this client.</p>}
                  {history.slice(0, 6).map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <span>{prettyDate(h.date)} <span className="text-muted-foreground">· {h.purpose}</span></span>
                      <span className={cn(h.status === "cancelled" && "text-muted-foreground line-through")}>{inr(h.total)}</span>
                    </div>
                  ))}
                </Block>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {b && <BookingDialog open={editing} onOpenChange={setEditing} booking={b} />}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.subject}</DialogTitle></DialogHeader>
          {preview && b && <EmailFrame booking={b} template={preview.template} className="h-[70svh]" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
      <Separator className="mt-5" />
    </div>
  );
}
const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-6 text-sm">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right">{v}</span>
  </div>
);
