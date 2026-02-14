"use client";

import type { Editor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const buttons = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      label: "Bold",
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      label: "Italic",
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      label: "Bullet list",
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      label: "Numbered list",
    },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)]">
      {buttons.map(({ icon: Icon, action, active, label }) => (
        <button
          key={label}
          type="button"
          onClick={action}
          title={label}
          className={`p-1.5 rounded-md transition-colors ${
            active
              ? "bg-[var(--color-brand-100)] text-[var(--color-brand-700)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
