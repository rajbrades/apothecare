import { requireAdmin } from "@/lib/auth/admin";
import Link from "next/link";
import { ShieldAlert, Users, Activity, Flag, Library } from "lucide-react";

export default async function AdminDashboardPage() {
    await requireAdmin();

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-500 mb-8">Manage users, view audit logs, and monitor system health.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {/* Audit Logs */}
                <Link
                    href="/admin/audits"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <ShieldAlert className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Audit Logs</h2>
                    <p className="text-sm text-slate-500">View detailed access logs for HIPAA compliance and security monitoring.</p>
                </Link>

                {/* User Management */}
                <Link
                    href="/admin/users"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-brand-50)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-brand-100)] transition-colors">
                        <Users className="text-[var(--color-brand-600)]" size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">User Management</h2>
                    <p className="text-sm text-slate-500">Search practitioners, verify licenses, and manage subscriptions.</p>
                </Link>

                {/* Flagged Citations */}
                <Link
                    href="/admin/flagged-citations"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-[var(--color-gold-50)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-gold-100)] transition-colors">
                        <Flag className="text-[var(--color-gold-600)]" size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Flagged Citations</h2>
                    <p className="text-sm text-slate-500">Review citations flagged by practitioners as incorrect or suspect.</p>
                </Link>

                {/* Partnerships */}
                <Link
                    href="/admin/partnerships"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
                        <Library className="text-violet-600" size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Partnerships</h2>
                    <p className="text-sm text-slate-500">Manage partner knowledge bases, document ingestion, and practitioner access.</p>
                </Link>

                {/* Job Queue */}
                <Link
                    href="/admin/jobs"
                    className="group block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                        <Activity className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Job Queue</h2>
                    <p className="text-sm text-slate-500">Monitor background processing for labs and document extraction.</p>
                </Link>
            </div>
        </div>
    );
}
