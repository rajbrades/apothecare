export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-40px)]">
      <div className="h-12 border-b border-[var(--color-border-light)] bg-white" />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-400)] thinking-dot" />
        </div>
      </div>
    </div>
  );
}
