"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CreditCard, Landmark, Lock, QrCode, ShieldCheck, Wallet, X } from "lucide-react";
import { inr } from "@/lib/logic";
import type { PayMethod } from "@/lib/types";
import { VENUE } from "@/lib/venue";

// ponytail: simulated gateway for the demo. Swap for Razorpay Checkout.js (`new Razorpay(options).open()`) when going live.

type View = "home" | "upi" | "card" | "netbanking" | "bank" | "wallet" | "processing" | "success" | "failed";

interface Props {
  open: boolean;
  amount: number;
  description: string;
  contact: { mobile: string; email: string };
  onClose: () => void;
  onSuccess: (method: PayMethod, txnId: string) => void;
}

const BLUE = "#3395FF";
const NAVY = "#072654";
const BANKS = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Federal"];
const WALLETS = ["Amazon Pay", "Mobikwik", "Freecharge", "Airtel Money"];

const newTxn = () => "pay_" + Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"[b % 56]).join("");

export function RazorpayCheckout({ open, amount, description, contact, onClose, onSuccess }: Props) {
  const [view, setView] = useState<View>("home");
  const [method, setMethod] = useState<PayMethod>("UPI");
  const [txnId, setTxnId] = useState("");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ number: "4111 1111 1111 1111", expiry: "12/30", cvv: "123", name: "" });
  const [bank, setBank] = useState("HDFC");
  const [step, setStep] = useState(0);


  const pay = (m: PayMethod, fail = false) => {
    setMethod(m);
    setView("processing");
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 1100);
    const t2 = setTimeout(() => setStep(2), 2200);
    const t3 = setTimeout(() => {
      if (fail) return setView("failed");
      const id = newTxn();
      setTxnId(id);
      setView("success");
    }, 3300);
    return () => [t1, t2, t3].forEach(clearTimeout);
  };

  useEffect(() => {
    if (view !== "success") return;
    const t = setTimeout(() => onSuccess(method, txnId), 2600);
    return () => clearTimeout(t);
  }, [view, method, txnId, onSuccess]);

  const busy = view === "processing" || view === "success";
  const back = ["upi", "card", "netbanking", "wallet"].includes(view) ? "home" : view === "bank" ? "netbanking" : null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Payment checkout"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-2xl bg-white font-sans text-[#162B4D] shadow-2xl sm:h-[540px] sm:max-w-[760px] sm:flex-row sm:rounded-xl"
          >
            {/* Merchant panel */}
            <div className="relative shrink-0 overflow-hidden p-5 text-white sm:w-[290px] sm:p-7" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0d3c84 100%)` }}>
              <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/5" />
              <div className="absolute -bottom-20 -left-10 size-56 rounded-full bg-white/5" />
              <div className="relative flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-white font-display text-lg font-semibold" style={{ color: NAVY }}>
                  TC
                </div>
                <div>
                  <div className="text-[15px] font-semibold">{VENUE.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-white/70">
                    <ShieldCheck className="size-3" /> Razorpay Trusted Business
                  </div>
                </div>
              </div>
              <div className="relative mt-5 hidden sm:block">
                <div className="text-[11px] tracking-wider text-white/60 uppercase">Price summary</div>
                <div className="mt-1 text-3xl font-semibold tracking-tight">{inr(amount)}</div>
                <div className="mt-2 text-xs leading-relaxed text-white/70">{description}</div>
              </div>
              <div className="relative mt-3 flex items-center justify-between sm:hidden">
                <span className="text-xs text-white/70">{description}</span>
                <span className="text-lg font-semibold">{inr(amount)}</span>
              </div>
              <div className="relative mt-6 hidden rounded-lg bg-white/10 p-3 text-xs sm:block">
                <div className="text-white/60">Using as</div>
                <div className="mt-1 font-medium">+91 {contact.mobile}</div>
                <div className="truncate text-white/80">{contact.email}</div>
              </div>
              <div className="absolute bottom-6 left-7 hidden items-center gap-1.5 text-[11px] text-white/60 sm:flex">
                <Lock className="size-3" /> Secured by <span className="font-semibold text-white/90">Razorpay</span>
              </div>
            </div>

            {/* Payment panel */}
            <div className="relative flex min-h-[420px] flex-1 flex-col bg-[#F7F9FC]">
              <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-5">
                <div className="flex items-center gap-2">
                  {back && (
                    <button onClick={() => setView(back as View)} className="-ml-1 rounded p-1 hover:bg-slate-100" aria-label="Back">
                      <ChevronLeft className="size-4" />
                    </button>
                  )}
                  <span className="text-sm font-semibold">
                    {{ home: "Payment Options", upi: "UPI / QR", card: "Add card", netbanking: "Netbanking", bank: `${bank} Bank`, wallet: "Wallets", processing: "Processing", success: "Payment Successful", failed: "Payment Failed" }[view]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700">TEST MODE</span>
                  {!busy && (
                    <button onClick={() => { setView("home"); onClose(); }} aria-label="Close checkout" className="rounded p-1 text-slate-500 hover:bg-slate-100">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="relative flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.18 }}
                    className="h-full p-5"
                  >
                    {view === "home" && (
                      <div className="space-y-2.5">
                        <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Recommended</div>
                        <Option icon={<QrCode />} title="UPI / QR" sub="Google Pay, PhonePe, Paytm & more" onClick={() => setView("upi")} />
                        <Option icon={<CreditCard />} title="Cards" sub="Visa, Mastercard, RuPay & Amex" onClick={() => setView("card")} />
                        <Option icon={<Landmark />} title="Netbanking" sub="All Indian banks" onClick={() => setView("netbanking")} />
                        <Option icon={<Wallet />} title="Wallet" sub="Amazon Pay, Mobikwik & more" onClick={() => setView("wallet")} />
                      </div>
                    )}

                    {view === "upi" && (
                      <div className="space-y-5">
                        <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
                          <FakeQR seed={amount} />
                          <div className="text-xs leading-relaxed text-slate-600">
                            <div className="text-sm font-semibold text-[#162B4D]">Scan to pay</div>
                            Scan with any UPI app to pay {inr(amount)}.
                            <button onClick={() => pay("UPI")} className="mt-2 block font-semibold" style={{ color: BLUE }}>
                              Simulate scan & pay →
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <label className="block text-xs font-medium text-slate-600">
                          UPI ID
                          <input
                            value={upi}
                            onChange={(e) => setUpi(e.target.value)}
                            placeholder="example@okhdfcbank"
                            className="mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#3395FF] focus:ring-2 focus:ring-[#3395FF]/20"
                          />
                        </label>
                        <PayButton disabled={!/^[\w.-]+@[\w]+$/.test(upi)} onClick={() => pay("UPI")} amount={amount} />
                      </div>
                    )}

                    {view === "card" && (
                      <form
                        className="space-y-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          pay("Card");
                        }}
                      >
                        <Field label="Card number" value={card.number} onChange={(v) => setCard({ ...card, number: v })} />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Expiry (MM/YY)" value={card.expiry} onChange={(v) => setCard({ ...card, expiry: v })} />
                          <Field label="CVV" value={card.cvv} type="password" onChange={(v) => setCard({ ...card, cvv: v })} />
                        </div>
                        <Field label="Card holder name" value={card.name} placeholder="Name on card" onChange={(v) => setCard({ ...card, name: v })} />
                        <p className="text-[11px] text-slate-500">Test card pre-filled. No real charge is made.</p>
                        <PayButton disabled={card.number.replace(/\s/g, "").length < 15 || !card.name} amount={amount} />
                      </form>
                    )}

                    {view === "netbanking" && (
                      <div className="grid grid-cols-3 gap-2.5">
                        {BANKS.map((b) => (
                          <button
                            key={b}
                            onClick={() => {
                              setBank(b);
                              setView("bank");
                            }}
                            className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border bg-white text-xs font-medium transition hover:border-[#3395FF] hover:shadow-sm"
                          >
                            <Landmark className="size-5 text-slate-500" />
                            {b}
                          </button>
                        ))}
                      </div>
                    )}

                    {view === "bank" && (
                      <div className="rounded-lg border bg-white p-5 text-sm">
                        <div className="font-semibold">{bank} Bank · Test Gateway</div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          This simulates your bank&apos;s page. Choose an outcome to see how the checkout handles it.
                        </p>
                        <div className="mt-5 flex gap-2">
                          <button onClick={() => pay("Netbanking")} className="h-10 flex-1 rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
                            Success
                          </button>
                          <button onClick={() => pay("Netbanking", true)} className="h-10 flex-1 rounded-md bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700">
                            Failure
                          </button>
                        </div>
                      </div>
                    )}

                    {view === "wallet" && (
                      <div className="space-y-2.5">
                        {WALLETS.map((w) => (
                          <Option key={w} icon={<Wallet />} title={w} sub="Link & pay" onClick={() => pay("Wallet")} />
                        ))}
                      </div>
                    )}

                    {view === "processing" && <Processing step={step} method={method} />}
                    {view === "success" && <Success amount={amount} txnId={txnId} />}
                    {view === "failed" && (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="flex size-20 items-center justify-center rounded-full bg-rose-500">
                          <X className="size-10 text-white" strokeWidth={3} />
                        </motion.div>
                        <div className="mt-5 text-lg font-semibold">Payment failed</div>
                        <p className="mt-1 max-w-xs text-xs text-slate-500">Your bank declined this test transaction. No money was debited.</p>
                        <button onClick={() => setView("home")} className="mt-6 h-11 rounded-md px-8 text-sm font-semibold text-white" style={{ background: BLUE }}>
                          Retry payment
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex h-10 shrink-0 items-center justify-center gap-1.5 border-t bg-white text-[10px] text-slate-400 sm:hidden">
                <Lock className="size-3" /> Secured by Razorpay
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Option({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-4 rounded-lg border bg-white p-4 text-left transition hover:border-[#3395FF] hover:shadow-sm">
      <span className="flex size-9 items-center justify-center rounded-md bg-[#EEF5FF] text-[#3395FF] [&_svg]:size-4.5">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-slate-500">{sub}</span>
      </span>
      <ChevronRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm tracking-wide outline-none focus:border-[#3395FF] focus:ring-2 focus:ring-[#3395FF]/20"
      />
    </label>
  );
}

function PayButton({ amount, disabled, onClick }: { amount: number; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={disabled}
      className="h-12 w-full rounded-md text-sm font-semibold text-white shadow-sm transition disabled:opacity-40"
      style={{ background: BLUE }}
    >
      Pay {inr(amount)}
    </button>
  );
}

function Processing({ step, method }: { step: number; method: PayMethod }) {
  const msgs =
    method === "UPI"
      ? ["Sending request to your UPI app", "Waiting for approval", "Confirming with bank"]
      : ["Connecting securely", "Authorising with your bank", "Confirming payment"];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="relative size-24">
        <motion.svg viewBox="0 0 100 100" className="absolute inset-0" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#E3EEFF" strokeWidth="6" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round" strokeDasharray="70 210" />
        </motion.svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>
            <ShieldCheck className="size-9" style={{ color: NAVY }} />
          </motion.div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-6 text-sm font-semibold">
          {msgs[step]}…
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-slate-200">
        <motion.div className="h-full" style={{ background: BLUE }} initial={{ width: "5%" }} animate={{ width: `${(step + 1) * 33}%` }} transition={{ duration: 1 }} />
      </div>
      <p className="mt-4 text-[11px] text-slate-500">Please don&apos;t close or refresh this window.</p>
    </div>
  );
}

function Success({ amount, txnId }: { amount: number; txnId: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="relative flex size-28 items-center justify-center">
        {[0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border-2 border-emerald-400"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.4, delay: 0.35 + i * 0.35, repeat: Infinity, repeatDelay: 0.6 }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              className="absolute size-1.5 rounded-full"
              style={{ background: i % 2 ? BLUE : "#10b981" }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(a) * 70, y: Math.sin(a) * 70, opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            />
          );
        })}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className="relative flex size-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
        >
          <svg viewBox="0 0 52 52" className="size-11">
            <motion.path
              d="M14 27 l8 8 l16 -18"
              fill="none"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="mt-5 text-lg font-semibold">Payment successful</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{inr(amount)}</div>
        <div className="mt-2 font-mono text-[11px] text-slate-500">{txnId}</div>
      </motion.div>
      <div className="mt-6 w-48">
        <div className="text-[11px] text-slate-500">Redirecting you back to {VENUE.name}…</div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
          <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.4, ease: "linear" }} />
        </div>
      </div>
    </div>
  );
}

function FakeQR({ seed }: { seed: number }) {
  const cells = useMemo(() => {
    let a = seed | 0;
    const rnd = () => ((a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const n = 25;
    const finder = (x: number, y: number) =>
      [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const out: [number, number][] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!finder(x, y) && rnd() > 0.52) out.push([x, y]);
    return out;
  }, [seed]);
  return (
    <svg viewBox="-1 -1 27 27" className="size-28 shrink-0 rounded bg-white" shapeRendering="crispEdges" aria-label="UPI QR code">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={NAVY} />
      ))}
      <Finder x={0} y={0} />
      <Finder x={18} y={0} />
      <Finder x={0} y={18} />
    </svg>
  );
}

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={7} height={7} fill={NAVY} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill={NAVY} />
    </g>
  );
}
