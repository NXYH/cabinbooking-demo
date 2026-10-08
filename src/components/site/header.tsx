"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VENUE } from "@/lib/venue";

const NAV = [
  { href: "/#space", label: "The space" },
  { href: "/#facilities", label: "Facilities" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/reviews", label: "Reviews" },
  { href: "/portal", label: "My bookings" },
];

export function SiteHeader() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const overHero = path === "/" && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        overHero ? "bg-transparent text-white" : "border-b bg-background/85 text-foreground backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" className="font-display text-[1.35rem] tracking-[-0.03em]">
          {VENUE.name}
        </Link>
        <nav className="hidden items-center gap-8 text-[0.925rem] lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn("transition-opacity hover:opacity-100", overHero ? "opacity-85" : "opacity-75")}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/book"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 px-5 text-[0.925rem]",
              overHero && "bg-white text-ink hover:bg-white/90",
            )}
          >
            Book the hall
          </Link>
          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "lg:hidden", overHero && "hover:bg-white/10 hover:text-white")}
              aria-label="Open menu"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background p-8">
              <SheetTitle className="font-display text-2xl">{VENUE.name}</SheetTitle>
              <nav className="mt-6 flex flex-col gap-5 text-lg">
                {[...NAV, { href: "/book", label: "Book the hall" }, { href: "/admin", label: "Admin" }].map((n) => (
                  <Link key={n.href} href={n.href} className="text-xl font-medium">
                    {n.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
