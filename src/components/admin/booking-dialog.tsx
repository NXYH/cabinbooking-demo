"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SlotPicker, type Slot } from "@/components/slot-picker";
import { useApp } from "@/lib/store";
import { inr, normMobile, quote, validEmail, validMobile } from "@/lib/logic";
import type { Booking, PayMethod } from "@/lib/types";
import { PURPOSES } from "@/lib/venue";

const METHODS: PayMethod[] = ["UPI", "Card", "Netbanking", "Wallet", "Bank Transfer", "Cash"];
const blank = {
  pax: "", purpose: "Corporate meeting", contactName: "", mobile: "", email: "", place: "", organisation: "", orgAddress: "", gstin: "", notes: "",
  status: "confirmed" as Booking["status"], payStatus: "pending" as Booking["payment"]["status"], method: "Bank Transfer" as PayMethod,
};

export function BookingDialog({ open, onOpenChange, booking }: { open: boolean; onOpenChange: (o: boolean) => void; booking?: Booking }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-3xl">
        {open && <BookingForm key={booking?.id ?? "new"} booking={booking} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function BookingForm({ booking, onDone }: { booking?: Booking; onDone: () => void }) {
  const { settings, createBooking, updateBooking, sendEmail } = useApp();
  const [slot, setSlot] = useState<Slot>(() => (booking ? { date: booking.date, start: booking.start, hours: booking.hours } : { hours: settings.minHours }));
  const [f, setF] = useState(() =>
    booking
      ? {
          pax: String(booking.pax), purpose: booking.purpose, contactName: booking.contactName, mobile: booking.mobile, email: booking.email,
          place: booking.place, organisation: booking.organisation, orgAddress: booking.orgAddress ?? "", gstin: booking.gstin ?? "", notes: booking.notes ?? "",
          status: booking.status, payStatus: booking.payment.status, method: booking.payment.method,
        }
      : blank,
  );
  const [notify, setNotify] = useState(!booking);

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const q = slot.date && slot.start !== undefined ? quote(settings, slot.date, slot.hours) : null;

  const save = () => {
    if (!slot.date || slot.start === undefined) return toast.error("Pick a date and time slot.");
    const missing = (["contactName", "place", "organisation", "pax"] as const).filter((k) => !f[k].trim());
    if (missing.length) return toast.error("Fill in guests, contact name, place and organisation.");
    if (!validMobile(f.mobile)) return toast.error("Enter a valid 10-digit mobile number.");
    if (!validEmail(f.email)) return toast.error("Enter a valid email address.");
    if (Number(f.pax) > settings.maxPax) return toast.error(`Maximum capacity is ${settings.maxPax}.`);

    const prevPay = booking?.payment;
    const payment: Booking["payment"] = {
      status: f.payStatus,
      method: f.method,
      txnId: f.payStatus === "pending" ? undefined : prevPay?.txnId ?? `MAN${Date.now().toString().slice(-8)}`,
      paidAt: f.payStatus === "pending" ? undefined : prevPay?.paidAt ?? new Date().toISOString(),
    };
    const data = {
      date: slot.date, start: slot.start, hours: slot.hours, pax: Number(f.pax), purpose: f.purpose,
      contactName: f.contactName.trim(), mobile: normMobile(f.mobile), email: f.email.trim(), place: f.place.trim(),
      organisation: f.organisation.trim(), orgAddress: f.orgAddress.trim() || undefined, gstin: f.gstin.trim().toUpperCase() || undefined,
      notes: f.notes.trim() || undefined, status: f.status, payment,
    };
    try {
      const b = booking ? updateBooking(booking.id, data) : createBooking({ ...data, source: "manual" });
      if (notify) sendEmail(b.status === "cancelled" ? "cancelled" : b.status === "pending" ? "received" : "confirmed", b.id);
      toast.success(booking ? `Booking ${b.id} updated${notify ? ", client notified" : ""}.` : `Booking ${b.id} created${notify ? ", confirmation emailed" : ""}.`);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">{booking ? `Edit ${booking.id}` : "New manual booking"}</DialogTitle>
          <DialogDescription>{booking ? "Change the slot, details or payment. Price is recalculated if the slot changes." : "For phone, walk-in or corporate bookings taken offline."}</DialogDescription>
        </DialogHeader>

        <SlotPicker value={slot} onChange={setSlot} ignoreId={booking?.id} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Fld label="Guests"><Input type="number" value={f.pax} onChange={set("pax")} /></Fld>
          <Fld label="Purpose" className="sm:col-span-2">
            <Select value={f.purpose} onValueChange={(v) => setF({ ...f, purpose: String(v) })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{PURPOSES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </Fld>
          <Fld label="Contact name"><Input value={f.contactName} onChange={set("contactName")} /></Fld>
          <Fld label="Mobile"><Input value={f.mobile} maxLength={10} onChange={set("mobile")} /></Fld>
          <Fld label="Email"><Input type="email" value={f.email} onChange={set("email")} /></Fld>
          <Fld label="Place"><Input value={f.place} onChange={set("place")} /></Fld>
          <Fld label="Organisation"><Input value={f.organisation} onChange={set("organisation")} /></Fld>
          <Fld label="GSTIN"><Input value={f.gstin} maxLength={15} onChange={set("gstin")} /></Fld>
          <Fld label="Billing address" className="sm:col-span-3"><Input value={f.orgAddress} onChange={set("orgAddress")} /></Fld>
          <Fld label="Internal notes" className="sm:col-span-3"><Textarea rows={2} value={f.notes} onChange={set("notes")} /></Fld>
          <Fld label="Booking status">
            <Pick value={f.status} options={["pending", "confirmed", "completed", "cancelled"]} onChange={(v) => setF({ ...f, status: v as Booking["status"] })} />
          </Fld>
          <Fld label="Payment status">
            <Pick value={f.payStatus} options={["pending", "paid", "refunded"]} onChange={(v) => setF({ ...f, payStatus: v as Booking["payment"]["status"] })} />
          </Fld>
          <Fld label="Payment method">
            <Pick value={f.method} options={METHODS} onChange={(v) => setF({ ...f, method: v as PayMethod })} />
          </Fld>
        </div>

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(c) => setNotify(!!c)} /> Email the client
          </label>
          <div className="flex items-center gap-3">
            {q && <span className="text-sm text-muted-foreground">Total <span className="font-medium text-foreground">{inr(q.total)}</span> incl. GST</span>}
            <Button onClick={save}>{booking ? "Save changes" : "Create booking"}</Button>
          </div>
        </DialogFooter>
    </>
  );
}

function Fld({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Pick({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(String(v))}>
      <SelectTrigger className="w-full capitalize"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}</SelectContent>
    </Select>
  );
}
