import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";

export default async function ChatPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[calc(100vh-40px)]">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
          </div>
        </div>
      }
    >
      <ChatInterface defaultSources={practitioner.preferred_evidence_sources ?? null} />
    </Suspense>
  );
}
