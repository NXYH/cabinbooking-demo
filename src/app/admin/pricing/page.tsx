"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHead } from "@/components/admin/sidebar";
import { useApp } from "@/lib/store";
import { inr } from "@/lib/logic";

const FIELDS = [
  ["weekdayRate", "Weekday rate (₹ / hour)", "Monday to Friday"],
  ["weekendRate", "Weekend rate (₹ / hour)", "Saturday and Sunday"],
  ["minHours", "Minimum booking (hours)", "Shortest bookable block"],
  ["maxPax", "Maximum guests", "Capacity shown to customers"],
  ["taxRate", "GST (%)", "Applied on the hall rental"],
] as const;

export default function PricingPage() {
  const hydrated = useApp((s) => s.hydrated);
  return <PricingForm key={String(hydrated)} />;
}

function PricingForm() {
  const { settings, updateSettings } = useApp();
  const [f, setF] = useState(() => Object.fromEntries(FIELDS.map(([k]) => [k, String(settings[k])])));

  const save = () => {
    const vals = Object.fromEntries(FIELDS.map(([k]) => [k, Number(f[k])]));
    if (Object.values(vals).some((v) => !Number.isFinite(v) || v < 0)) return toast.error("Enter valid positive numbers.");
    if (vals.minHours < 1) return toast.error("Minimum booking must be at least 1 hour.");
    updateSettings(vals);
    toast.success("Pricing updated. New bookings will use these rates.");
  };
  const n = (k: string) => Number(f[k]) || 0;
  const total = (rate: number, h: number) => Math.round(rate * h * (1 + n("taxRate") / 100));

  return (
    <>
      <PageHead title="Pricing" sub="Hourly rates and booking rules. Existing bookings keep the price they were booked at.">
        <Button onClick={save}>Save pricing</Button>
      </PageHead>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Rates & rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {FIELDS.map(([k, label, hint]) => (
              <div key={k} className="grid items-center gap-2 sm:grid-cols-[1fr_180px]">
                <div>
                  <Label className="text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <Input type="number" min={0} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="text-right tabular-nums" />
              </div>
            ))}
            <div className="flex items-center justify-between gap-6 rounded-lg border p-4">
              <div>
                <Label className="text-sm">Auto-confirm paid online bookings</Label>
                <p className="text-xs text-muted-foreground">When off, paid bookings wait in “Pending” for your approval before the confirmation email goes out.</p>
              </div>
              <Switch
                checked={settings.autoConfirm}
                onCheckedChange={(c) => { updateSettings({ autoConfirm: !!c }); toast.success(c ? "Online bookings will confirm automatically." : "Online bookings now need manual approval."); }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Price preview</CardTitle>
            <CardDescription>What customers pay, including GST</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Weekday</TableHead>
                  <TableHead className="text-right">Weekend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[2, 3, 4, 6, 8, 10].filter((h) => h >= n("minHours")).map((h) => (
                  <TableRow key={h}>
                    <TableCell>{h} hours{h >= 8 ? ", full day" : h >= 4 ? ", half day" : ""}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(total(n("weekdayRate"), h))}</TableCell>
                    <TableCell className="text-right tabular-nums">{inr(total(n("weekendRate"), h))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
