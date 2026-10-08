"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHead } from "@/components/admin/sidebar";
import { EmailFrame } from "@/components/shared/email-frame";
import { useApp } from "@/lib/store";
import { PLACEHOLDERS } from "@/lib/emails";
import type { Booking, SentEmail, TemplateKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const KEYS: TemplateKey[] = ["confirmed", "invoice", "review", "received", "cancelled"];

export default function EmailsPage() {
  const { templates, outbox, bookings } = useApp();
  const [key, setKey] = useState<TemplateKey>("confirmed");
  const [view, setView] = useState<SentEmail | null>(null);
  const sample = useMemo(() => bookings.find((b) => b.status === "confirmed") ?? bookings[0], [bookings]);


  return (
    <>
      <PageHead title="Email templates" sub="HTML emails sent to clients. Use {{placeholders}}; they are filled from the booking." />
      <Tabs defaultValue="templates">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="outbox">Sent log ({outbox.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <div className="grid gap-4 xl:grid-cols-[220px_1fr_1fr]">
            <div className="flex gap-2 overflow-x-auto xl:flex-col">
              {KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setKey(k)}
                  className={cn("shrink-0 rounded-lg border px-4 py-3 text-left text-sm transition", key === k ? "border-foreground bg-foreground text-background" : "bg-card hover:bg-muted")}
                >
                  {templates[k].name}
                </button>
              ))}
            </div>

            <Editor key={`${key}:${templates[key].subject}:${templates[key].html}`} tkey={key} sample={sample} />
          </div>
        </TabsContent>

        <TabsContent value="outbox">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Sent</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="pr-5">Booking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outbox.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => setView(m)}>
                    <TableCell className="pl-5 text-xs">{new Date(m.sentAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                    <TableCell>{templates[m.template].name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.to}</TableCell>
                    <TableCell className="max-w-xs truncate">{m.subject}</TableCell>
                    <TableCell className="pr-5 tabular-nums text-xs">{m.bookingId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{view?.subject}</DialogTitle></DialogHeader>
          {view && bookings.find((b) => b.id === view.bookingId) && (
            <EmailFrame booking={bookings.find((b) => b.id === view.bookingId)!} template={view.template} className="h-[70svh]" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Editor({ tkey: key, sample }: { tkey: TemplateKey; sample?: Booking }) {
  const { templates, saveTemplate, resetTemplate, sendEmail } = useApp();
  const [draft, setDraft] = useState(templates[key]);
  const dirty = draft.html !== templates[key].html || draft.subject !== templates[key].subject;
  return (
    <>
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground">Subject</Label>
                  <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground">HTML body</Label>
                  <Textarea value={draft.html} onChange={(e) => setDraft({ ...draft, html: e.target.value })} className="h-[440px] tabular-nums text-[11px] leading-relaxed" spellCheck={false} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {PLACEHOLDERS.map((p) => (
                    <button key={p} onClick={() => { navigator.clipboard?.writeText(`{{${p}}}`); toast(`Copied {{${p}}}`); }} className="rounded border bg-muted/50 px-1.5 py-0.5 tabular-nums text-[10px] hover:bg-muted">
                      {`{{${p}}}`}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="ghost" onClick={() => { resetTemplate(key); toast.success("Template restored to default."); }}><RotateCcw /> Reset</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast.success(`Test email “${templates[key].name}” sent to reservations@thecabin.in`)}><Send /> Send test</Button>
                    <Button disabled={!dirty} onClick={() => { saveTemplate(key, draft); toast.success("Template saved."); }}>Save template</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">Live preview with booking {sample?.id}</div>
              {sample && <EmailFrame booking={sample} html={draft.html} className="h-[640px]" />}
              {sample && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => { sendEmail(key, sample.id); toast.success(`Sent to ${sample.email}`); }}>
                  Send to {sample.contactName}
                </Button>
              )}
            </div>
    </>
  );
}
