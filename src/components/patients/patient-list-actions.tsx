"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { PatientInviteCreate } from "./patient-invite-create";

export function PatientListActions() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-brand-600)] border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-100)] transition-colors"
        >
          <Mail className="w-4 h-4" />
          Quick Invite
        </button>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand-600)] rounded-[var(--radius-md)] hover:bg-[var(--color-brand-500)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Patient
        </Link>
      </div>

      <PatientInviteCreate
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onCreated={() => router.refresh()}
      />
    </>
  );
}
