"use client";
import { Star } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex gap-0.5", className)} role="img" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("size-3.5", i <= value ? "fill-teak text-teak" : "text-border")} />
      ))}
    </div>
  );
}

export function ReviewCard({ r }: { r: { name: string; organisation: string; rating: number; text: string } }) {
  return (
    <figure className="flex h-full flex-col justify-between border-t pt-6">
      <div>
        <Stars value={r.rating} />
        <blockquote className="mt-4 text-lg leading-relaxed">{r.text}</blockquote>
      </div>
      <figcaption className="mt-6 text-sm">
        <div className="font-medium">{r.name}</div>
        <div className="text-muted-foreground">{r.organisation}</div>
      </figcaption>
    </figure>
  );
}

export function ReviewsPreview() {
  const reviews = useApp((s) => s.reviews).filter((r) => r.published).slice(0, 3);
  return (
    <div className="grid gap-10 md:grid-cols-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} r={r} />
      ))}
    </div>
  );
}
