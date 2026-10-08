# The Cabin · Conference hall booking (client demo)

Next.js 16 + shadcn/ui (Base UI) front-end demo. No backend: all data is dummy seed data persisted in the browser's localStorage.

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm check        # pricing/availability self-check
```

## Where things are

| Area | Route |
|---|---|
| Landing (video hero, space, facilities, gallery, reviews) | `/` |
| Booking + simulated Razorpay checkout | `/book` → `/booking/[id]` |
| Reviews | `/reviews` |
| Client portal (look up by mobile, e.g. `9847012301`) | `/portal` |
| Printable GST invoice | `/invoice/[id]` |
| Admin: dashboard, bookings, slots, pricing, clients, payments, email templates, reviews | `/admin` |

## Swapping in client content

- **Hero video:** drop the file at `public/media/hall.mp4`. It fades in over the hero image once it plays.
- **Venue copy, capacity, facilities, address, GSTIN:** `src/lib/venue.ts`.
- **Dummy data:** `src/lib/seed.ts`. Use "Reset demo data" in the admin sidebar to restore it.

## Demo notes

- Payments are simulated (TEST MODE). Netbanking offers Success/Failure to show both paths. Going live means swapping `src/components/razorpay-checkout.tsx` for Razorpay Checkout.js plus a server-side order and signature check.
- Emails are not sent. They are logged in Admin → Email Templates → Sent log and rendered from the editable HTML templates.
- Admin has no login in the demo.
