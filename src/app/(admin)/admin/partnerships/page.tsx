import { requireAdmin } from "@/lib/auth/admin";
import { PartnershipsClient } from "./partnerships-client";

export default async function PartnershipsPage() {
  await requireAdmin();

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Partnership Management
      </h1>
      <p className="text-slate-500 mb-8">
        Manage partner knowledge bases, ingested documents, and practitioner access.
      </p>
      <PartnershipsClient />
    </div>
  );
}
