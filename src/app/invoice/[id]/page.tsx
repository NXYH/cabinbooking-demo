"use client";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayBadge } from "@/components/shared/status";
import { useApp } from "@/lib/store";
import { hourLabel, inr, prettyDate, rateFor } from "@/lib/logic";
import { VENUE } from "@/lib/venue";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const b = useApp((s) => s.bookings.find((x) => x.id === id));
  const settings = useApp((s) => s.settings);
  const hydrated = useApp((s) => s.hydrated);
  if (!b) return <div className="p-20 text-center text-muted-foreground">{hydrated ? "Invoice not found." : ""}</div>;

  const rate = b.subtotal / b.hours || rateFor(settings, b.date);
  const half = Math.round(b.tax / 2);
  const intra = !b.gstin || b.gstin.startsWith("32"); // Kerala: CGST + SGST, else IGST
  return (
    <div className="min-h-screen bg-secondary/50 py-10 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-6 flex max-w-3xl justify-end px-5">
        <Button onClick={() => window.print()} className="px-5">
          <Printer /> Print / Save PDF
        </Button>
      </div>
      <article className="mx-auto max-w-3xl bg-white p-10 shadow-sm ring-1 ring-border print:shadow-none print:ring-0 md:p-14">
        <header className="flex flex-col justify-between gap-6 border-b pb-8 sm:flex-row">
          <div>
            <div className="font-display text-4xl">{VENUE.name}</div>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
              {VENUE.address}
              <br />
              {VENUE.phone}, {VENUE.email}
              <br />
              GSTIN {VENUE.gstin}
            </p>
          </div>
          <div className="sm:text-right">
            <div className="eyebrow">Tax invoice</div>
            <div className="mt-2 tabular-nums text-lg">INV-{b.id.replace("BMC-", "")}</div>
            <div className="mt-1 text-xs text-muted-foreground">Issued {new Date(b.payment.paidAt ?? b.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
            <div className="mt-2"><PayBadge status={b.payment.status} /></div>
          </div>
        </header>

        <section className="grid gap-8 py-8 sm:grid-cols-2">
          <div>
            <div className="eyebrow">Billed to</div>
            <div className="mt-2 font-medium">{b.organisation}</div>
            <div className="text-sm text-muted-foreground">
              {b.contactName}
              <br />
              {b.orgAddress ?? b.place}
              <br />
              +91 {b.mobile}, {b.email}
              {b.gstin && <><br />GSTIN {b.gstin}</>}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="eyebrow">Booking</div>
            <div className="mt-2 tabular-nums text-sm">{b.id}</div>
            <div className="text-sm text-muted-foreground">
              {prettyDate(b.date)}
              <br />
              {hourLabel(b.start)} – {hourLabel(b.start + b.hours)}, {b.pax} guests
              <br />
              {b.purpose}
            </div>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y text-left text-xs text-muted-foreground">
              <th className="py-3">Description</th>
              <th className="py-3">SAC</th>
              <th className="py-3 text-right">Hours</th>
              <th className="py-3 text-right">Rate</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-4">Conference hall rental, AV, Wi-Fi & host included</td>
              <td className="py-4 text-muted-foreground">997212</td>
              <td className="py-4 text-right">{b.hours}</td>
              <td className="py-4 text-right">{inr(rate)}</td>
              <td className="py-4 text-right">{inr(b.subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <Row k="Subtotal" v={inr(b.subtotal)} />
          {intra ? (
            <>
              <Row k={`CGST (${settings.taxRate / 2}%)`} v={inr(half)} />
              <Row k={`SGST (${settings.taxRate / 2}%)`} v={inr(b.tax - half)} />
            </>
          ) : (
            <Row k={`IGST (${settings.taxRate}%)`} v={inr(b.tax)} />
          )}
          <div className="flex items-baseline justify-between border-t pt-3">
            <span className="font-medium">Total</span>
            <span className="font-display text-3xl">{inr(b.total)}</span>
          </div>
        </div>

        <footer className="mt-12 grid gap-6 border-t pt-6 text-xs text-muted-foreground sm:grid-cols-2">
          <div>
            <div className="eyebrow">Payment</div>
            <div className="mt-1">
              {b.payment.method}, {b.payment.status}
              {b.payment.txnId && <><br /><span className="tabular-nums">{b.payment.txnId}</span></>}
            </div>
          </div>
          <div className="sm:text-right">This is a computer-generated invoice and does not require a signature. Thank you for choosing {VENUE.name}.</div>
        </footer>
      </article>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{k}</span>
    <span>{v}</span>
  </div>
);
