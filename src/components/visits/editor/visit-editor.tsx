"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextAlign } from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/react";
import { TemplateSectionExtension } from "@/lib/editor/template-section-extension";
import { ENCOUNTER_TEMPLATES } from "@/lib/templates/definitions";
import {
  templateToEditorContent,
  templateToPopulatedContent,
  editorContentToText,
} from "@/lib/templates/to-editor-content";
import { EditorToolbar } from "./editor-toolbar";
import { DictationBar } from "./dictation-bar";
import type { VisitType } from "@/lib/validations/visit";

interface VisitEditorProps {
  visitType: VisitType;
  visitId: string;
  /** Saved editor state from DB — if present, restores instead of loading template */
  initialContent?: JSONContent | null;
  /** Auto-start in transcribe mode */
  autoTranscribe?: boolean;
  disabled?: boolean;
  onContentChange?: (json: JSONContent, text: string) => void;
  /** Called when user clicks "Complete Note" from dictation bar */
  onCompleteNote?: () => void;
  /** Sections from workspace-level AI Scribe — populates editor when set */
  scribedSections?: Record<string, string> | null;
}

export function VisitEditor({
  visitType,
  visitId,
  initialContent,
  autoTranscribe,
  disabled,
  onContentChange,
  onCompleteNote,
  scribedSections,
}: VisitEditorProps) {
  const isInitialized = useRef(false);

  // Determine initial editor content: saved state or fresh template
  const getInitialContent = useCallback((): JSONContent => {
    if (initialContent) return initialContent;
    const template = ENCOUNTER_TEMPLATES[visitType];
    if (template) return templateToEditorContent(template);
    return templateToEditorContent(ENCOUNTER_TEMPLATES.soap);
  }, [initialContent, visitType]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "paragraph") {
            return "";
          }
          return "";
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TemplateSectionExtension,
    ],
    content: getInitialContent(),
    immediatelyRender: false,
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      if (!isInitialized.current) return;
      const json = ed.getJSON();
      const text = editorContentToText(json);
      onContentChange?.(json, text);
    },
  });

  // Mark initialized after first render to skip the initial content load trigger
  useEffect(() => {
    if (editor && !isInitialized.current) {
      // Small delay to skip the initial content-load update
      const timer = setTimeout(() => {
        isInitialized.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editor]);

  // Reload template when visitType changes (only for fresh visits without saved content)
  const prevVisitTypeRef = useRef(visitType);
  useEffect(() => {
    if (!editor || !isInitialized.current) return;
    if (visitType === prevVisitTypeRef.current) return;
    prevVisitTypeRef.current = visitType;

    // Only swap template if there's no saved content
    if (initialContent) return;

    const template = ENCOUNTER_TEMPLATES[visitType] || ENCOUNTER_TEMPLATES.soap;
    const newContent = templateToEditorContent(template);
    editor.commands.setContent(newContent);

    // Trigger content change callback so parent saves the new template
    const json = editor.getJSON();
    const text = editorContentToText(json);
    onContentChange?.(json, text);
  }, [visitType, editor, initialContent, onContentChange]);

  // Update editable state when disabled changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  /**
   * Handle AI Scribe completion — populate editor sections with assigned content.
   * Builds a new Tiptap document from the template with sections filled in.
   */
  const handleScribeComplete = useCallback(
    (sections: Record<string, string>) => {
      if (!editor) return;

      const template =
        ENCOUNTER_TEMPLATES[visitType] || ENCOUNTER_TEMPLATES.soap;
      const populatedContent = templateToPopulatedContent(template, sections);

      // Replace editor content with populated sections
      editor.commands.setContent(populatedContent);

      // Trigger content change callback so parent saves the new state
      const json = editor.getJSON();
      const text = editorContentToText(json);
      onContentChange?.(json, text);
    },
    [editor, visitType, onContentChange]
  );

  // Populate editor when workspace-level AI Scribe provides sections
  useEffect(() => {
    if (scribedSections && editor) {
      handleScribeComplete(scribedSections);
    }
  }, [scribedSections, editor, handleScribeComplete]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--color-text-muted)]">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="visit-editor">
        <EditorContent editor={editor} />
      </div>

      {/* Dictation bar */}
      <DictationBar
        editor={editor}
        visitId={visitId}
        autoStart={autoTranscribe}
        disabled={disabled}
        onCompleteNote={onCompleteNote}
        onScribeComplete={handleScribeComplete}
      />
    </div>
  );
}
