"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Clock, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SlotPicker, type Slot } from "@/components/slot-picker";
import { RazorpayCheckout } from "@/components/razorpay-checkout";
import { useApp } from "@/lib/store";
import { inr, normMobile, prettyDate, quote, timeRange, validEmail, validMobile } from "@/lib/logic";
import { PURPOSES } from "@/lib/venue";
import type { PayMethod } from "@/lib/types";

const EMPTY = { pax: "", purpose: "", contactName: "", place: "", mobile: "", email: "", organisation: "", orgAddress: "", gstin: "", notes: "" };
type Form = typeof EMPTY;

export default function BookPage() {
  const router = useRouter();
  const { settings, createBooking, setStatus, sendEmail } = useApp();
  const [slot, setSlot] = useState<Slot>({ hours: settings.minHours });
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form | "slot", string>>>({});
  const [paying, setPaying] = useState(false);

  const q = slot.date && slot.start !== undefined ? quote(settings, slot.date, slot.hours) : null;
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setF({ ...f, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!slot.date || slot.start === undefined) e.slot = "Choose a date and start time.";
    else if (slot.hours < settings.minHours) e.slot = `Minimum booking is ${settings.minHours} hours.`;
    const pax = Number(f.pax);
    if (!pax || pax < 1) e.pax = "Enter number of guests.";
    else if (pax > settings.maxPax) e.pax = `The hall seats up to ${settings.maxPax}.`;
    if (!f.purpose) e.purpose = "Select a purpose.";
    if (f.contactName.trim().length < 2) e.contactName = "Enter the contact person's name.";
    if (!f.place.trim()) e.place = "Enter your city or place.";
    if (!validMobile(f.mobile)) e.mobile = "Enter a valid 10-digit Indian mobile number.";
    if (!validEmail(f.email)) e.email = "Enter a valid email for the confirmation.";
    if (!f.organisation.trim()) e.organisation = "Enter organisation name (or 'Individual').";
    if (f.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i.test(f.gstin)) e.gstin = "GSTIN should be 15 characters, e.g. 32ABCDE1234F1Z5.";
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error("Please check the highlighted fields.");
      document.querySelector(`[data-field="${Object.keys(e)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const onPaid = (method: PayMethod, txnId: string) => {
    try {
      const b = createBooking({
        date: slot.date!,
        start: slot.start!,
        hours: slot.hours,
        pax: Number(f.pax),
        purpose: f.purpose,
        contactName: f.contactName.trim(),
        place: f.place.trim(),
        mobile: normMobile(f.mobile),
        email: f.email.trim(),
        organisation: f.organisation.trim(),
        orgAddress: f.orgAddress.trim() || undefined,
        gstin: f.gstin.trim().toUpperCase() || undefined,
        notes: f.notes.trim() || undefined,
        status: "pending",
        payment: { status: "paid", method, txnId, paidAt: new Date().toISOString() },
        source: "online",
      });
      if (settings.autoConfirm) {
        setStatus(b.id, "confirmed");
        sendEmail("invoice", b.id);
      } else sendEmail("received", b.id);
      router.push(`/booking/${b.id}`);
    } catch (err) {
      setPaying(false);
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <h1 className="font-display text-5xl md:text-6xl">Book the hall</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Choose your hours, tell us about the event and pay online. Your confirmation email arrives straight away.</p>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_380px]">
        <form
          className="space-y-14"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (validate()) setPaying(true);
          }}
        >
          <Section n="1" title="Date & time">
            <div data-field="slot">
              <SlotPicker value={slot} onChange={(v) => { setSlot(v); setErrors({ ...errors, slot: undefined }); }} />
              <Err msg={errors.slot} />
            </div>
          </Section>

          <Section n="2" title="Your event">
            <div className="grid gap-5 sm:grid-cols-2">
              <F label="Number of guests" err={errors.pax} k="pax">
                <Input type="number" min={1} max={settings.maxPax} inputMode="numeric" placeholder={`Up to ${settings.maxPax}`} value={f.pax} onChange={set("pax")} className="h-11" />
              </F>
              <F label="Purpose of booking" err={errors.purpose} k="purpose">
                <Select value={f.purpose || null} onValueChange={(v) => { setF({ ...f, purpose: String(v ?? "") }); setErrors({ ...errors, purpose: undefined }); }}>
                  <SelectTrigger className="h-11! w-full">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Special requests (optional)" className="sm:col-span-2" k="notes">
                <Textarea rows={3} placeholder="Seating layout, catering, AV needs…" value={f.notes} onChange={set("notes")} />
              </F>
            </div>
          </Section>

          <Section n="3" title="Contact person">
            <div className="grid gap-5 sm:grid-cols-2">
              <F label="Full name" err={errors.contactName} k="contactName">
                <Input autoComplete="name" value={f.contactName} onChange={set("contactName")} className="h-11" />
              </F>
              <F label="Mobile number" err={errors.mobile} k="mobile">
                <div className="flex">
                  <span className="flex h-11 items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+91</span>
                  <Input type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} value={f.mobile} onChange={set("mobile")} className="h-11 rounded-l-none" />
                </div>
              </F>
              <F label="Email" err={errors.email} k="email">
                <Input type="email" autoComplete="email" value={f.email} onChange={set("email")} className="h-11" />
              </F>
              <F label="Place / City" err={errors.place} k="place">
                <Input autoComplete="address-level2" value={f.place} onChange={set("place")} className="h-11" />
              </F>
            </div>
          </Section>

          <Section n="4" title="Organisation">
            <div className="grid gap-5 sm:grid-cols-2">
              <F label="Organisation name" err={errors.organisation} k="organisation">
                <Input autoComplete="organization" value={f.organisation} onChange={set("organisation")} className="h-11" />
              </F>
              <F label="GSTIN (optional)" err={errors.gstin} k="gstin">
                <Input value={f.gstin} onChange={set("gstin")} placeholder="For GST invoice" className="h-11 uppercase placeholder:normal-case" maxLength={15} />
              </F>
              <F label="Billing address (optional)" className="sm:col-span-2" k="orgAddress">
                <Input value={f.orgAddress} onChange={set("orgAddress")} className="h-11" />
              </F>
            </div>
          </Section>

          <div className="lg:hidden">
            <Summary q={q} slot={slot} pax={f.pax} />
          </div>
          <Button type="submit" size="lg" className="h-12 w-full text-[0.95rem] lg:hidden">
            <Lock /> {q ? `Pay ${inr(q.total)}` : "Continue to payment"}
          </Button>
          <button type="submit" id="pay-submit" className="hidden" />
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <Summary q={q} slot={slot} pax={f.pax} />
            <Button size="lg" className="h-12 w-full text-[0.95rem]" onClick={() => document.getElementById("pay-submit")?.click()}>
              <Lock /> {q ? `Pay ${inr(q.total)}` : "Continue to payment"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Free cancellation up to 48 hours before your slot.</p>
          </div>
        </aside>
      </div>

      {q && paying && (
        <RazorpayCheckout
          open
          amount={q.total}
          description={`${prettyDate(slot.date!)}, ${timeRange(slot.start!, slot.hours)}`}
          contact={{ mobile: normMobile(f.mobile), email: f.email }}
          onClose={() => setPaying(false)}
          onSuccess={onPaid}
        />
      )}
    </div>
  );
}

function Summary({ q, slot, pax }: { q: ReturnType<typeof quote> | null; slot: Slot; pax: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/hall.jpg" alt="" className="h-36 w-full object-cover" />
      <div className="p-6">
        <div className="font-display text-2xl">Main hall</div>
        <div className="mt-4 space-y-2.5 text-sm">
          <Line icon={<CalendarDays />} text={slot.date ? prettyDate(slot.date) : "Select a date"} muted={!slot.date} />
          <Line icon={<Clock />} text={slot.start !== undefined ? `${timeRange(slot.start, slot.hours)}, ${slot.hours} hrs` : "Select hours"} muted={slot.start === undefined} />
          <Line icon={<Users />} text={pax ? `${pax} guests` : "Guests"} muted={!pax} />
        </div>
        <Separator className="my-5" />
        {q ? (
          <div className="space-y-2 text-sm">
            <Row k={`${inr(q.rate)} × ${slot.hours} hrs`} v={inr(q.subtotal)} />
            <Row k="GST (18%)" v={inr(q.tax)} />
            <Separator className="my-3" />
            <div className="flex items-baseline justify-between">
              <span className="font-medium">Total</span>
              <span className="font-display text-3xl">{inr(q.total)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Your price appears here once you pick your hours.</p>
        )}
      </div>
    </div>
  );
}

const Line = ({ icon, text, muted }: { icon: React.ReactNode; text: string; muted?: boolean }) => (
  <div className={`flex items-center gap-3 [&_svg]:size-4 [&_svg]:text-brand ${muted ? "text-muted-foreground" : ""}`}>
    {icon}
    {text}
  </div>
);
const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between text-muted-foreground">
    <span>{k}</span>
    <span className="text-foreground">{v}</span>
  </div>
);

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-6 flex items-baseline gap-4 border-b pb-4">
        <span className="text-sm font-medium text-muted-foreground tabular-nums">Step {n}</span>
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function F({ label, err, k, className, children }: { label: string; err?: string; k: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className} data-field={k}>
      <Label className="mb-2 text-xs tracking-wide text-muted-foreground">{label}</Label>
      <div aria-invalid={!!err} className="[&[aria-invalid=true]_input]:border-destructive [&[aria-invalid=true]_button]:border-destructive">
        {children}
      </div>
      <Err msg={err} />
    </div>
  );
}

const Err = ({ msg }: { msg?: string }) => (msg ? <p className="mt-1.5 text-xs text-destructive">{msg}</p> : null);
