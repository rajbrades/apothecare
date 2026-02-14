import type { JSONContent } from "@tiptap/react";
import type { EncounterTemplate } from "./types";

/**
 * Convert a template definition into Tiptap editor JSON content.
 * Each section becomes a `templateSection` node with an empty paragraph inside.
 */
export function templateToEditorContent(template: EncounterTemplate): JSONContent {
  return {
    type: "doc",
    content: template.sections.map((section) => ({
      type: "templateSection",
      attrs: {
        sectionKey: section.key,
        heading: section.heading,
        badge: section.badge,
        placeholder: section.placeholder,
        collapsed: section.defaultCollapsed,
      },
      content: [
        {
          type: "paragraph",
        },
      ],
    })),
  };
}

/**
 * Flatten Tiptap editor JSON into labeled text for AI processing.
 *
 * Output format:
 * ```
 * ## Chief Complaint
 * Patient presents with fatigue...
 *
 * ## Assessment
 * Suspected thyroid dysfunction...
 * ```
 *
 * Only includes sections with non-empty content.
 */
export function editorContentToText(json: JSONContent): string {
  if (!json.content) return "";

  const parts: string[] = [];

  for (const node of json.content) {
    if (node.type !== "templateSection") continue;

    const heading = node.attrs?.heading as string;
    const text = extractTextFromContent(node.content || []);

    if (text.trim()) {
      parts.push(`## ${heading}\n${text.trim()}`);
    }
  }

  return parts.join("\n\n");
}

/**
 * Build a populated Tiptap editor JSON document from a template + section content map.
 * Used by the AI Scribe to populate sections after parsing a transcript.
 *
 * Sections with content get populated; sections without remain empty.
 * All populated sections are auto-expanded (collapsed: false).
 */
export function templateToPopulatedContent(
  template: EncounterTemplate,
  sectionContent: Record<string, string>
): JSONContent {
  return {
    type: "doc",
    content: template.sections.map((section) => {
      const text = sectionContent[section.key];
      const hasContent = text && text.trim().length > 0;

      return {
        type: "templateSection",
        attrs: {
          sectionKey: section.key,
          heading: section.heading,
          badge: section.badge,
          placeholder: section.placeholder,
          // Auto-expand sections that have content
          collapsed: hasContent ? false : section.defaultCollapsed,
        },
        content: hasContent
          ? textToParagraphs(text)
          : [{ type: "paragraph" }],
      };
    }),
  };
}

/**
 * Convert plain text (potentially with line breaks) into an array
 * of Tiptap paragraph nodes.
 */
function textToParagraphs(text: string): JSONContent[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [{ type: "paragraph" }];
  }

  return lines.map((line) => ({
    type: "paragraph",
    content: [{ type: "text", text: line }],
  }));
}

/**
 * Recursively extract plain text from Tiptap JSON content nodes.
 */
function extractTextFromContent(content: JSONContent[]): string {
  const lines: string[] = [];

  for (const node of content) {
    if (node.type === "text") {
      lines.push(node.text || "");
    } else if (node.type === "paragraph") {
      const text = extractTextFromContent(node.content || []);
      lines.push(text + "\n");
    } else if (node.type === "bulletList" || node.type === "orderedList") {
      for (const item of node.content || []) {
        const text = extractTextFromContent(item.content || []);
        lines.push(`- ${text.trim()}\n`);
      }
    } else if (node.type === "hardBreak") {
      lines.push("\n");
    } else if (node.content) {
      lines.push(extractTextFromContent(node.content));
    }
  }

  return lines.join("");
}
