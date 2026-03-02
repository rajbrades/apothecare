import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getAuthUser, getPractitioner } from "@/lib/supabase/cached-queries";
import { createClient } from "@/lib/supabase/server";
import { escapePostgrestPattern } from "@/lib/search";
import { ConversationListClient } from "@/components/conversations/conversation-list-client";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const practitioner = await getPractitioner(user.id);
  if (!practitioner) redirect("/auth/onboarding");

  const { search } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("conversations")
    .select("id, title, patient_id, is_favorited, is_archived, created_at, updated_at, patients(first_name, last_name)")
    .eq("practitioner_id", practitioner.id)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (search) {
    const escaped = escapePostgrestPattern(search);
    query = query.ilike("title", `%${escaped}%`);
  }

  const { data: conversations } = await query;
  const conversationList = conversations || [];

  const nextCursor = conversationList.length === 20
    ? conversationList[conversationList.length - 1].updated_at
    : null;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-12 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Conversations</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Browse and search your past conversations
          </p>
        </div>
      </div>

      {conversationList.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mb-4">
            <MessageSquare className="w-7 h-7 text-[var(--color-brand-600)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-medium text-[var(--color-text-primary)] mb-1">No conversations yet</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Start a new conversation from the dashboard
          </p>
        </div>
      ) : (
        <ConversationListClient
          initialConversations={conversationList}
          initialCursor={nextCursor}
        />
      )}
    </div>
  );
}
