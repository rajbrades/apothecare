"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Activity, LogOut, FileText } from "lucide-react";
import { Logomark } from "@/components/ui/logomark";

const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/audits", icon: ShieldAlert, label: "Audit Logs" },
    { href: "/admin/users", icon: Users, label: "User Management" },
    { href: "/admin/jobs", icon: Activity, label: "Job Queue" },
    { href: "/admin/partnerships", icon: FileText, label: "Partnerships" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-50">
            {/* Header */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                <div className="bg-red-500/10 p-1 rounded">
                    <Logomark size="xs" className="text-red-500" />
                </div>
                <span className="font-semibold text-slate-100 tracking-tight">Admin Console</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                    ? "bg-red-500/10 text-red-500 font-medium"
                                    : "hover:bg-slate-800 hover:text-slate-100"
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                    <LogOut size={18} />
                    Back to App
                </Link>
            </div>
        </aside>
    );
}
