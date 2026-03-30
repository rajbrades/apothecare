import { redirect, notFound } from "next/navigation";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { auditLogServer } from "@/lib/api/audit";
import { ProtocolWorkspace } from "@/components/protocols/protocol-workspace";

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string; protocolId: string }>;
}) {
  const { id: patientId, protocolId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const supabase = await createClient();

  const [{ data: protocol }, { data: phases }, { data: patient }] = await Promise.all([
    supabase
      .from("treatment_protocols")
      .select("*")
      .eq("id", protocolId)
      .eq("patient_id", patientId)
      .eq("practitioner_id", practitioner.id)
      .single(),
    supabase
      .from("protocol_phases")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("phase_number", { ascending: true }),
    supabase
      .from("patients")
      .select("first_name, last_name")
      .eq("id", patientId)
      .single(),
  ]);

  if (!protocol || !patient) notFound();

  auditLogServer({
    practitionerId: practitioner.id,
    action: "read",
    resourceType: "treatment_protocol",
    resourceId: protocolId,
  });

  const patientName = [patient.first_name, patient.last_name].filter(Boolean).join(" ");

  return (
    <div className="max-w-5xl mx-auto px-6 pt-8 pb-12">
      <ProtocolWorkspace
        protocol={{ ...protocol, phases: phases || [] }}
        patientId={patientId}
        patientName={patientName}
        tier={practitioner.subscription_tier}
      />
    </div>
  );
}
