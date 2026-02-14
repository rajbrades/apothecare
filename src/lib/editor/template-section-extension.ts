import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TemplateSectionNode } from "@/components/visits/editor/template-section-node";

export const TemplateSectionExtension = Node.create({
  name: "templateSection",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      sectionKey: { default: "" },
      heading: { default: "Section" },
      badge: { default: "" },
      placeholder: { default: "" },
      collapsed: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="template-section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "template-section" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TemplateSectionNode);
  },
});
