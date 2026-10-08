"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReviewCard, Stars } from "@/components/site/reviews-preview";
import { useApp } from "@/lib/store";
import type { Booking, Review } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ReviewsPage() {
  return (
    <Suspense>
      <Reviews />
    </Suspense>
  );
}

function Reviews() {
  const params = useSearchParams();
  const { reviews, bookings, addReview, hydrated } = useApp();
  const published = reviews.filter((r) => r.published);
  const avg = published.reduce((a, r) => a + r.rating, 0) / (published.length || 1);
  const fromBooking = bookings.find((b) => b.id === params.get("booking"));
  useEffect(() => {
    if (params.get("booking")) document.getElementById("write")?.scrollIntoView({ behavior: "smooth" });
  }, [params]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <div className="grid gap-10 border-b pb-14 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="font-display text-5xl md:text-6xl">Reviews</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="font-display text-6xl leading-none tabular-nums">{avg.toFixed(1)}</div>
          <div>
            <Stars value={Math.round(avg)} />
            <div className="mt-1 text-sm text-muted-foreground">{published.length} verified reviews</div>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-5 md:grid-cols-2">
          {published.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
        <aside id="write" className="scroll-mt-28">
          <ReviewForm key={String(hydrated)} fromBooking={fromBooking} onSubmit={addReview} />
        </aside>
      </div>
    </div>
  );
}

function ReviewForm({ fromBooking, onSubmit }: { fromBooking?: Booking; onSubmit: (r: Omit<Review, "id" | "date" | "published">) => void }) {
  const [form, setForm] = useState({ name: fromBooking?.contactName ?? "", organisation: fromBooking?.organisation ?? "", rating: 0, text: "" });
  const [hover, setHover] = useState(0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.rating || form.text.trim().length < 10)
      return toast.error("Please add your name, a star rating and at least a sentence.");
    onSubmit({ ...form, name: form.name.trim(), organisation: form.organisation.trim() || "Guest", text: form.text.trim() });
    toast.success(form.rating >= 4 ? "Thank you! Your review is now live." : "Thank you! Your feedback has been sent to our team.");
    setForm({ name: "", organisation: "", rating: 0, text: "" });
  };

  return (
          <form onSubmit={submit} className="sticky top-28 space-y-5 rounded-2xl border bg-card p-7">
            <div>
              <h2 className="font-display text-3xl">Share your experience</h2>
              {fromBooking && <p className="mt-1 text-xs text-muted-foreground">For booking {fromBooking.id}</p>}
            </div>
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Your rating</Label>
              <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button type="button" key={i} onMouseEnter={() => setHover(i)} onClick={() => setForm({ ...form, rating: i })} aria-label={`${i} stars`}>
                    <Star className={cn("size-7 transition-colors", i <= (hover || form.rating) ? "fill-teak text-teak" : "text-border")} strokeWidth={1.2} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Name</Label>
              <Input className="h-11" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Organisation</Label>
              <Input className="h-11" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Your review</Label>
              <Textarea rows={5} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="What stood out about the space and service?" />
            </div>
            <Button type="submit" size="lg" className="h-12 w-full">
              Submit review
            </Button>
          </form>
  );
}
