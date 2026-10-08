"use client";
import { useSyncExternalStore } from "react";
import { fill, templateVars } from "@/lib/emails";
import { useApp } from "@/lib/store";
import type { Booking, TemplateKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const noop = () => () => {};

/** Renders an email template filled with a booking, in an isolated iframe. */
export function EmailFrame({ booking, template, html, className }: { booking: Booking; template?: TemplateKey; html?: string; className?: string }) {
  const tpl = useApp((s) => (template ? s.templates[template].html : ""));
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const doc = fill(html ?? tpl, templateVars(booking, origin)).replace("<head>", '<head><base target="_blank">');
  return <iframe title="Email preview" srcDoc={doc} className={cn("h-[640px] w-full rounded-xl border bg-secondary", className)} />;
}
