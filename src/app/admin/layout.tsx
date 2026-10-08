import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = { title: "The Cabin admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
