"use client";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageHead } from "@/components/admin/sidebar";
import { Stars } from "@/components/site/reviews-preview";
import { useApp } from "@/lib/store";
import { prettyDate } from "@/lib/logic";

export default function AdminReviews() {
  const { reviews, toggleReview, bookings, sendEmail } = useApp();
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / (reviews.length || 1);
  const toAsk = bookings.filter((b) => b.status === "completed" && !b.reviewRequested).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <PageHead title="Reviews" sub="Moderate what appears on the website and ask past clients for feedback." />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted-foreground">{prettyDate(r.date)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{r.text}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{r.name}, {r.organisation}</div>
                </div>
                <label className="flex shrink-0 flex-col items-end gap-1.5 text-xs text-muted-foreground">
                  <Switch checked={r.published} onCheckedChange={() => { toggleReview(r.id); toast.success(r.published ? "Hidden from website." : "Published on website."); }} />
                  {r.published ? "Published" : "Hidden"}
                </label>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent>
              <div className="text-xs text-muted-foreground">Average rating</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="font-display text-5xl">{avg.toFixed(1)}</span>
                <Stars value={Math.round(avg)} />
              </div>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = reviews.filter((r) => r.rating === n).length;
                  return (
                    <div key={n} className="flex items-center gap-2 text-xs">
                      <span className="w-3">{n}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${(c / (reviews.length || 1)) * 100}%` }} /></div>
                      <span className="w-4 text-right text-muted-foreground">{c}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ask for reviews</CardTitle>
              <CardDescription>{toAsk.length} completed bookings haven&apos;t been asked yet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                disabled={!toAsk.length}
                onClick={() => {
                  const batch = toAsk.slice(0, 10);
                  batch.forEach((b) => sendEmail("review", b.id));
                  toast.success(`Review request sent to ${batch.length} clients.`);
                }}
              >
                <Send /> Send to latest {Math.min(10, toAsk.length)}
              </Button>
              <div className="divide-y text-sm">
                {toAsk.slice(0, 6).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2">
                    <span>{b.contactName}<span className="block text-xs text-muted-foreground">{prettyDate(b.date)}</span></span>
                    <Button size="xs" variant="ghost" onClick={() => { sendEmail("review", b.id); toast.success(`Asked ${b.contactName} for a review.`); }}>Ask</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
