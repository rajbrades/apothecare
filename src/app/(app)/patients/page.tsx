import { Users } from "lucide-react";

export default function PatientsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-40px)] px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-[var(--color-brand-600)]" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
          Patient Management
        </h1>

        {/* Description */}
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
          Manage patient profiles, track health histories, and link conversations
          and lab results for comprehensive, longitudinal care.
        </p>

        {/* Coming Soon badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-brand-50)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
          Coming Soon
        </span>
      </div>
    </div>
  );
}
