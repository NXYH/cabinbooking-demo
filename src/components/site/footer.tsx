import Link from "next/link";
import { VENUE } from "@/lib/venue";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-[2fr_1fr_1fr] md:px-8">
        <div>
          <div className="font-display text-3xl text-white">{VENUE.name}</div>
          <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed">
            A private conference hall on Marine Drive, Kochi, booked by the hour for meetings, trainings and launches.
          </p>
        </div>
        <div className="space-y-3 text-[0.95rem]">
          <div className="font-medium text-white">Visit</div>
          <p className="leading-relaxed">{VENUE.address}</p>
          <p>
            <a href={`tel:${VENUE.phone.replace(/\s/g, "")}`} className="hover:text-white">{VENUE.phone}</a>
            <br />
            <a href={`mailto:${VENUE.email}`} className="hover:text-white">{VENUE.email}</a>
          </p>
          <p>Monday to Saturday, 08:00 to 22:00</p>
        </div>
        <div className="space-y-3 text-[0.95rem]">
          <div className="font-medium text-white">Explore</div>
          <ul className="space-y-2">
            {[
              ["/book", "Book the hall"],
              ["/reviews", "Reviews"],
              ["/portal", "My bookings"],
              ["/#facilities", "Facilities"],
              ["/admin", "Venue admin"],
            ].map(([h, l]) => (
              <li key={h}>
                <Link href={h} className="transition-colors hover:text-white">{l}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-6 text-sm text-white/50 md:flex-row md:px-8">
          <span>© 2026 {VENUE.name}</span>
          <span>GSTIN {VENUE.gstin}. Prices exclude 18% GST.</span>
        </div>
      </div>
    </footer>
  );
}
