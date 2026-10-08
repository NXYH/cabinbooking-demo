import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS: Record<Booking["status"], string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-secondary text-secondary-foreground border-border",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};
const PAY: Record<Booking["payment"]["status"], string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-sky-50 text-sky-700 border-sky-200",
};

export const StatusBadge = ({ status }: { status: Booking["status"] }) => (
  <Badge variant="outline" className={cn("capitalize", STATUS[status])}>{status}</Badge>
);
export const PayBadge = ({ status }: { status: Booking["payment"]["status"] }) => (
  <Badge variant="outline" className={cn("capitalize", PAY[status])}>{status}</Badge>
);
