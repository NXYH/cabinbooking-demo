import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FACILITIES, VENUE } from "@/lib/venue";
import { HeroMedia } from "@/components/site/hero-media";
import { NextSlot, SpecTable } from "@/components/site/next-slot";
import { ReviewsPreview } from "@/components/site/reviews-preview";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-end text-white">
        <HeroMedia />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 pb-14 md:grid-cols-[1fr_auto] md:items-end md:px-8 md:pb-20">
          <div>
            <h1 className="font-display max-w-4xl text-[2.9rem] sm:text-7xl md:text-[5.25rem]">
              The conference hall
              <br />
              on Marine Drive.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              {VENUE.sqft.toLocaleString("en-IN")} sq ft for up to {VENUE.maxPax} guests, booked by the hour and fully serviced.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "h-12 bg-white px-7 text-[0.95rem] text-ink hover:bg-white/90")}>
                Check availability
              </Link>
              <a href="#space" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "h-12 px-5 text-[0.95rem] text-white hover:bg-white/10 hover:text-white")}>
                See the space
              </a>
            </div>
          </div>
          <div className="border-l border-white/30 pl-5">
            <NextSlot />
          </div>
        </div>
      </section>

      {/* The space */}
      <section id="space" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">One room, set the way your meeting needs it.</h2>
            <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-muted-foreground">
              Floor-to-ceiling glass over the backwaters, timber acoustic panels and a column-free floor that resets between bookings. An event host
              and tested AV come with every hour you book.
            </p>
            <div className="mt-10">
              <h3 className="text-sm font-medium">Seating layouts</h3>
              <ul className="mt-3 grid grid-cols-2 gap-x-8 text-[0.95rem] sm:grid-cols-3">
                {VENUE.layouts.map((l) => (
                  <li key={l.name} className="flex justify-between border-b py-2.5">
                    <span>{l.name}</span>
                    <span className="text-muted-foreground tabular-nums">{l.pax}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <SpecTable />
            <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "mt-8 h-11 px-6")}>
              See open hours
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="scroll-mt-20">
        <div className="grid auto-rows-[46vw] grid-cols-2 gap-1 md:auto-rows-[26vw] md:grid-cols-4">
          {VENUE.gallery.map((g, i) => (
            <figure key={g.src} className={cn("relative overflow-hidden bg-muted", i === 0 && "col-span-2 row-span-2", i >= 3 && "col-span-2")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.src} alt={g.alt} loading="lazy" className="h-full w-full object-cover" />
            </figure>
          ))}
        </div>
      </section>

      {/* Facilities */}
      <section id="facilities" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Included in the hourly rate.</h2>
            <p className="mt-6 max-w-sm text-[1.05rem] leading-relaxed text-muted-foreground">No AV surcharge, no cleaning fee, no minimum spend on catering.</p>
          </div>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {FACILITIES.map((f) => (
              <li key={f.title} className="flex gap-4 border-t py-5">
                <f.icon className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.6} />
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{f.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How booking works: a real sequence */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
          <h2 className="font-display text-3xl md:text-4xl">Booking takes about two minutes.</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              ["Choose your hours", "Pick a date and the hours you need. Open slots update live."],
              ["Pay online", "UPI, cards, netbanking or wallets. A GST invoice is issued automatically."],
              ["Get confirmation", "Your confirmation email arrives straight away. The room is ready 15 minutes before you start."],
            ].map(([t, d], i) => (
              <li key={t} className="border-t-2 border-ink pt-5">
                <div className="text-sm text-muted-foreground">Step {i + 1}</div>
                <div className="mt-1 text-lg font-medium">{t}</div>
                <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-5 py-24 md:px-8 md:py-32">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-display text-4xl md:text-5xl">What organisers say.</h2>
          <Link href="/reviews" className="text-[0.95rem] font-medium text-brand underline-offset-4 hover:underline">
            Read all reviews
          </Link>
        </div>
        <div className="mt-12">
          <ReviewsPreview />
        </div>
      </section>

      {/* Closing */}
      <section className="bg-brand text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-20 md:flex-row md:items-center md:px-8">
          <div>
            <h2 className="font-display text-4xl md:text-5xl">Hold the date.</h2>
            <p className="mt-3 max-w-md text-white/75">Free cancellation up to 48 hours before your booking.</p>
          </div>
          <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "h-12 bg-white px-7 text-[0.95rem] text-brand hover:bg-white/90")}>
            Book the hall
          </Link>
        </div>
      </section>
    </>
  );
}
