"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, CalendarClock, CalendarRange, CreditCard, ExternalLink, IndianRupee, Mail, Menu, RotateCcw, Star, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { href: "/admin/availability", label: "Slots & Availability", icon: CalendarClock },
  { href: "/admin/pricing", label: "Pricing", icon: IndianRupee },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/emails", label: "Email Templates", icon: Mail },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

function Nav() {
  const path = usePathname();
  const pending = useApp((s) => s.bookings).filter((b) => b.status === "pending").length;
  const resetDemo = useApp((s) => s.resetDemo);
  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="px-6 pt-7 pb-8">
        <div className="font-display text-xl">The Cabin</div>
        <div className="text-sm text-muted-foreground">Venue admin</div>
      </Link>
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active ? "bg-brand text-white" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.6} />
              <span className="flex-1">{label}</span>
              {label === "Bookings" && pending > 0 && (
                <span className={cn("rounded-full px-1.5 text-[10px] font-medium", active ? "bg-background/20" : "bg-amber-100 text-amber-800")}>{pending}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
          <ExternalLink className="size-4" strokeWidth={1.6} /> View website
        </Link>
        <button
          onClick={() => {
            resetDemo();
            toast.success("Demo data restored to the original seed.");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <RotateCcw className="size-4" strokeWidth={1.6} /> Reset demo data
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-soft font-display text-sm">AK</div>
          <div className="text-xs leading-tight">
            <div className="font-medium">Anil Kurian</div>
            <div className="text-muted-foreground">Venue manager</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-sidebar lg:block">
        <Nav />
      </aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
        <div className="font-display text-lg">The Cabin admin</div>
        <Sheet>
          <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Open menu">
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <Nav />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
