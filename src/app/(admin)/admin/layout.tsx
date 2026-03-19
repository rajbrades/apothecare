import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdmin();

    return (
        <div className="flex bg-slate-50 min-h-screen text-slate-900 font-sans">
            <AdminSidebar />
            <main className="pt-14 md:pt-0 md:ml-64 flex-1">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
