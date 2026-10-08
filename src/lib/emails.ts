import type { Booking, EmailTemplate, TemplateKey } from "./types";
import { VENUE } from "./venue";
import { inr, prettyDate, timeRange } from "./logic";

export const PLACEHOLDERS = [
  "customer_name", "organisation", "booking_id", "date", "time", "hours", "pax", "purpose",
  "subtotal", "tax", "total", "payment_method", "payment_status", "txn_id", "paid_on",
  "venue_name", "venue_address", "venue_phone", "venue_email", "venue_gstin",
  "invoice_link", "portal_link", "review_link",
] as const;

export function templateVars(b: Booking, origin = ""): Record<string, string> {
  return {
    customer_name: b.contactName,
    organisation: b.organisation,
    booking_id: b.id,
    date: prettyDate(b.date),
    time: timeRange(b.start, b.hours),
    hours: String(b.hours),
    pax: String(b.pax),
    purpose: b.purpose,
    subtotal: inr(b.subtotal),
    tax: inr(b.tax),
    total: inr(b.total),
    payment_method: b.payment.method,
    payment_status: b.payment.status.toUpperCase(),
    txn_id: b.payment.txnId ?? "—",
    paid_on: b.payment.paidAt ? new Date(b.payment.paidAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "—",
    venue_name: VENUE.name,
    venue_address: VENUE.address,
    venue_phone: VENUE.phone,
    venue_email: VENUE.email,
    venue_gstin: VENUE.gstin,
    invoice_link: `${origin}/invoice/${b.id}`,
    portal_link: `${origin}/portal`,
    review_link: `${origin}/reviews?booking=${b.id}`,
  };
}

export const fill = (html: string, vars: Record<string, string>) =>
  html.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => vars[k] ?? m);

// ---------- default templates (table layout + inline styles for mail clients) ----------

const shell = (preheader: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{venue_name}}</title></head>
<body style="margin:0;padding:0;background:#f2f4f3;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f3;padding:40px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #d9dedc;border-radius:8px;overflow:hidden;font-family:-apple-system,'Segoe UI','Helvetica Neue',Arial,sans-serif;color:#1b2321;">
<tr><td style="padding:28px 40px;border-bottom:1px solid #e3e7e6;">
  <table width="100%" role="presentation"><tr>
  <td style="font-weight:600;letter-spacing:-0.5px;font-size:22px;letter-spacing:-0.5px;font-weight:600;">{{venue_name}}</td>
  <td align="right" style="font-size:13px;font-weight:600;color:#0e4a43;">Marine Drive, Kochi</td>
  </tr></table>
</td></tr>
${body}
<tr><td style="padding:28px 40px;background:#1b2321;color:#b8c4c1;font-size:12px;line-height:1.7;">
  <div style="font-weight:600;font-size:16px;color:#ffffff;margin-bottom:6px;">{{venue_name}}</div>
  {{venue_address}}<br>{{venue_phone}}, {{venue_email}}<br>
  <span style="color:#8a9593;">You are receiving this email because of booking {{booking_id}}.</span>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

const heading = (eyebrow: string, title: string, intro: string) => `
<tr><td style="padding:40px 40px 8px;">
  <div style="font-size:13px;font-weight:600;color:#0e4a43;margin-bottom:12px;">${eyebrow}</div>
  <div style="font-weight:600;letter-spacing:-0.5px;font-size:28px;line-height:1.2;color:#1b2321;">${title}</div>
  <p style="font-size:15px;line-height:1.7;color:#4a5553;margin:16px 0 0;">${intro}</p>
</td></tr>`;

const row = (k: string, v: string) =>
  `<tr><td style="padding:10px 0;border-bottom:1px solid #e3e7e6;font-size:13px;color:#6b7674;">${k}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #e3e7e6;font-size:14px;color:#1b2321;">${v}</td></tr>`;

const details = `
<tr><td style="padding:24px 40px;">
<table width="100%" role="presentation" cellpadding="0" cellspacing="0">
${row("Booking ID", "<strong>{{booking_id}}</strong>")}
${row("Date", "{{date}}")}
${row("Time", "{{time}} ({{hours}} hrs)")}
${row("Guests", "{{pax}}")}
${row("Purpose", "{{purpose}}")}
${row("Organisation", "{{organisation}}")}
</table>
</td></tr>`;

const button = (label: string, href: string) => `
<tr><td style="padding:8px 40px 40px;">
  <a href="${href}" style="display:inline-block;background:#1b2321;color:#f2f4f3;text-decoration:none;font-size:13px;font-weight:600;padding:14px 24px;border-radius:6px;">${label}</a>
</td></tr>`;

const totals = `
<tr><td style="padding:0 40px 24px;">
<table width="100%" role="presentation" cellpadding="0" cellspacing="0" style="background:#f2f4f3;border-radius:6px;padding:8px 20px;">
${row("Hall rental, {{hours}} hrs", "{{subtotal}}")}
${row("GST (18%)", "{{tax}}")}
<tr><td style="padding:14px 0;font-size:14px;color:#1b2321;"><strong>Total</strong></td><td align="right" style="padding:14px 0;font-weight:600;font-size:22px;color:#1b2321;">{{total}}</td></tr>
</table>
</td></tr>`;

export const DEFAULT_TEMPLATES: Record<TemplateKey, EmailTemplate> = {
  received: {
    key: "received",
    name: "Booking received",
    subject: "We've received your booking request, {{booking_id}}",
    html: shell(
      "Your request is with our team.",
      heading("Request received", "Thank you, {{customer_name}}.", "We've received your request for {{venue_name}}. Our events team will review it and send a confirmation shortly, usually within two working hours.") +
        details +
        button("View in client portal", "{{portal_link}}"),
    ),
  },
  confirmed: {
    key: "confirmed",
    name: "Booking confirmed",
    subject: "Confirmed: {{venue_name}} on {{date}}",
    html: shell(
      "Your booking is confirmed.",
      heading("Booking confirmed", "Your hall is reserved.", "Dear {{customer_name}}, we look forward to hosting {{organisation}}. Your booking and payment are confirmed. Our host will meet you at the reception 15 minutes before your slot.") +
        details +
        totals +
        `<tr><td style="padding:0 40px 24px;font-size:13px;line-height:1.7;color:#4a5553;"><strong style="color:#1b2321;">Good to know</strong><br>Complimentary valet parking, Wi-Fi details at the reception, Please share your AV requirements a day before.</td></tr>` +
        button("Download invoice", "{{invoice_link}}"),
    ),
  },
  invoice: {
    key: "invoice",
    name: "Tax invoice",
    subject: "Invoice for booking {{booking_id}}",
    html: shell(
      "Your tax invoice is attached.",
      heading("Tax invoice", "Invoice, {{booking_id}}", "Please find the summary of charges below. A printable invoice is available from the link. GSTIN {{venue_gstin}}.") +
        `<tr><td style="padding:24px 40px 0;"><table width="100%" role="presentation" cellpadding="0" cellspacing="0">
${row("Billed to", "{{organisation}}")}
${row("Event date", "{{date}}, {{time}}")}
${row("Payment", "{{payment_method}}, {{payment_status}}")}
${row("Transaction ID", "{{txn_id}}")}
${row("Paid on", "{{paid_on}}")}
</table></td></tr>` +
        `<tr><td style="height:24px"></td></tr>` +
        totals +
        button("View printable invoice", "{{invoice_link}}"),
    ),
  },
  review: {
    key: "review",
    name: "Review request",
    subject: "How was your time at {{venue_name}}?",
    html: shell(
      "Two minutes, five stars, one sentence.",
      heading("We'd love your thoughts", "How did we do, {{customer_name}}?", "Thank you for choosing {{venue_name}} for your {{purpose}} on {{date}}. Your feedback helps us refine every detail. It takes under a minute.") +
        `<tr><td style="padding:24px 40px 8px;font-size:32px;letter-spacing:8px;color:#8b5e34;">★★★★★</td></tr>` +
        button("Leave a review", "{{review_link}}"),
    ),
  },
  cancelled: {
    key: "cancelled",
    name: "Booking cancelled",
    subject: "Booking {{booking_id}} has been cancelled",
    html: shell(
      "Your booking has been cancelled.",
      heading("Cancellation", "Your booking is cancelled.", "Dear {{customer_name}}, booking {{booking_id}} for {{date}} has been cancelled. Any amount paid will be refunded to your original payment method within 5–7 working days.") +
        details +
        button("Book another date", "{{portal_link}}"),
    ),
  },
};
