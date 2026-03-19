"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Activity, Flag, LogOut, Menu, X } from "lucide-react";
import { Logomark } from "@/components/ui/logomark";

const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/audits", icon: ShieldAlert, label: "Audit Logs" },
    { href: "/admin/users", icon: Users, label: "User Management" },
    { href: "/admin/flagged-citations", icon: Flag, label: "Flagged Citations" },
    { href: "/admin/jobs", icon: Activity, label: "Job Queue" },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile header bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 p-1 rounded">
                        <Logomark size="xs" className="text-red-500" />
                    </div>
                    <span className="font-semibold text-slate-100 tracking-tight text-sm">Admin Console</span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 text-slate-300 hover:text-slate-100 transition-colors"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/30 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-50
                    transition-transform duration-200 ease-out
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0
                `}
            >
                {/* Header */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                    <div className="bg-red-500/10 p-1 rounded">
                        <Logomark size="xs" className="text-red-500" />
                    </div>
                    <span className="font-semibold text-slate-100 tracking-tight">Admin Console</span>
                    {/* Close button on mobile */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden ml-auto p-1 text-slate-400 hover:text-slate-100 transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
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
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={18} />
                        Back to App
                    </Link>
                </div>
            </aside>
        </>
    );
}
