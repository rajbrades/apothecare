import { requireAdmin } from "@/lib/auth/admin";
import { EvidenceManager } from "./evidence-manager";

export default async function EvidencePage() {
  await requireAdmin();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Evidence Database
      </h1>
      <p className="text-slate-500 mb-8">
        Seed from PubMed, run custom queries, and monitor the evidence knowledge base.
      </p>

      <EvidenceManager />
    </div>
  );
}
