export interface TemplateSectionDef {
  /** Unique key for this section, used for AI section mapping */
  key: string;
  /** Display heading */
  heading: string;
  /** Short label for the badge (1-3 chars) */
  badge: string;
  /** Placeholder text when section is empty */
  placeholder: string;
  /** Whether the section starts collapsed */
  defaultCollapsed: boolean;
}

export interface EncounterTemplate {
  /** Matches VisitType */
  visitType: string;
  /** Human-readable label */
  label: string;
  /** Sections in display order */
  sections: TemplateSectionDef[];
}
