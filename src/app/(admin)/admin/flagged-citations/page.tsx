import { requireAdmin } from "@/lib/auth/admin";
import { FlaggedCitationsClient } from "./flagged-citations-client";

export default async function FlaggedCitationsPage() {
  await requireAdmin();
  return <FlaggedCitationsClient />;
}
