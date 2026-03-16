import { requireAdmin } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { PartnershipManager } from "./partnership-manager";

export default async function PartnershipsPage() {
  await requireAdmin();

  const supabase = createServiceClient();
  const { data: partnerships } = await supabase
    .from("partnerships")
    .select("id, slug, name, description, is_active, created_at")
    .order("name");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Partnership Documents
      </h1>
      <p className="text-slate-500 mb-8">
        Upload PDFs to Supabase Storage and ingest them into the RAG pipeline.
      </p>

      <PartnershipManager partnerships={partnerships || []} />
    </div>
  );
}
