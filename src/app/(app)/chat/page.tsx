import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
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
      <ChatInterface />
    </Suspense>
  );
}
