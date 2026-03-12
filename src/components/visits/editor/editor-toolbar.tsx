"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  List,
  ListOrdered,
  ListChecks,
  Minus,
  Table,
  Undo2,
  Redo2,
  ChevronDown,
  Unlink,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  icon: Icon,
  action,
  active,
  label,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={action}
      title={label}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-[var(--color-brand-100)] text-[var(--color-brand-700)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function Divider() {
  return (
    <div className="w-px h-5 bg-[var(--color-border-light)] mx-0.5" />
  );
}

function HeadingDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const currentLevel = editor.isActive("heading", { level: 2 })
    ? "Heading 2"
    : editor.isActive("heading", { level: 3 })
      ? "Heading 3"
      : "Paragraph";

  const options = [
    { label: "Paragraph", action: () => editor.chain().focus().setParagraph().run() },
    { label: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Heading 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] rounded-md transition-colors min-w-[90px]"
      >
        {currentLevel}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] py-1 min-w-[130px]">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                opt.action();
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                currentLevel === opt.label
                  ? "bg-[var(--color-surface-secondary)] font-medium text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)] rounded-[var(--radius-md)] flex-wrap">
      {/* Heading dropdown */}
      <HeadingDropdown editor={editor} />

      <Divider />

      {/* Inline formatting */}
      <ToolbarButton
        icon={Bold}
        action={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold (Ctrl+B)"
      />
      <ToolbarButton
        icon={Italic}
        action={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic (Ctrl+I)"
      />
      <ToolbarButton
        icon={Underline}
        action={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        label="Underline (Ctrl+U)"
      />
      <ToolbarButton
        icon={Strikethrough}
        action={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      />

      <Divider />

      {/* Link */}
      <ToolbarButton
        icon={editor.isActive("link") ? Unlink : Link}
        action={
          editor.isActive("link")
            ? () => editor.chain().focus().unsetLink().run()
            : setLink
        }
        active={editor.isActive("link")}
        label={editor.isActive("link") ? "Remove link" : "Add link"}
      />

      <Divider />

      {/* Lists */}
      <ToolbarButton
        icon={List}
        action={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bullet list"
      />
      <ToolbarButton
        icon={ListOrdered}
        action={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Numbered list"
      />
      <ToolbarButton
        icon={ListChecks}
        action={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive("taskList")}
        label="Task list"
      />

      <Divider />

      {/* Block inserts */}
      <ToolbarButton
        icon={Minus}
        action={() => editor.chain().focus().setHorizontalRule().run()}
        label="Horizontal rule"
      />
      <ToolbarButton
        icon={Table}
        action={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        label="Insert table"
      />

      <Divider />

      {/* Undo / Redo */}
      <ToolbarButton
        icon={Undo2}
        action={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo (Ctrl+Z)"
      />
      <ToolbarButton
        icon={Redo2}
        action={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo (Ctrl+Shift+Z)"
      />
    </div>
  );
}
