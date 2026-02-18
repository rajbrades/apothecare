export type InjectionSeverity = "none" | "medium" | "high";

export interface InjectionScanResult {
  flagged: boolean;
  severity: InjectionSeverity;
  pattern?: string;
}

interface PatternRule {
  regex: RegExp;
  severity: InjectionSeverity;
  label: string;
}

const HIGH_SEVERITY_PATTERNS: PatternRule[] = [
  // Role switching
  { regex: /\byou\s+are\s+now\b/i, severity: "high", label: "role_switch:you_are_now" },
  { regex: /\bact\s+as\s+(?:a|an|my)\b/i, severity: "high", label: "role_switch:act_as" },
  { regex: /\bpretend\s+(?:you\s+are|to\s+be)\b/i, severity: "high", label: "role_switch:pretend" },
  { regex: /\broleplay\s+as\b/i, severity: "high", label: "role_switch:roleplay" },
  { regex: /\bfrom\s+now\s+on\s+you\s+(?:are|will)\b/i, severity: "high", label: "role_switch:from_now_on" },

  // Instruction override
  { regex: /\bignore\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?|context)\b/i, severity: "high", label: "override:ignore_previous" },
  { regex: /\bdisregard\s+(?:all\s+)?(?:your|the|previous|prior)\s+(?:instructions?|rules?|guidelines?)\b/i, severity: "high", label: "override:disregard" },
  { regex: /\bforget\s+(?:all\s+)?(?:your|the|previous|prior)\s+(?:instructions?|rules?|guidelines?)\b/i, severity: "high", label: "override:forget" },
  { regex: /\bdo\s+not\s+follow\s+(?:your|the|any)\s+(?:instructions?|rules?|guidelines?)\b/i, severity: "high", label: "override:do_not_follow" },
  { regex: /\bnew\s+instructions?\s*:/i, severity: "high", label: "override:new_instructions" },

  // System prompt extraction
  { regex: /\b(?:repeat|show|display|print|output|reveal)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?|rules?|system\s+message)\b/i, severity: "high", label: "extraction:show_prompt" },
  { regex: /\bwhat\s+(?:are|were)\s+your\s+(?:instructions?|rules?|guidelines?|system\s+prompt)\b/i, severity: "high", label: "extraction:what_are_rules" },

  // Delimiter injection
  { regex: /\n\s*(?:System|Human|Assistant)\s*:/i, severity: "high", label: "delimiter:role_prefix" },
  { regex: /<\|(?:system|im_start|im_end|endoftext)\|>/i, severity: "high", label: "delimiter:special_token" },
  { regex: /\[INST\]|\[\/INST\]|<<SYS>>|<\/s>/i, severity: "high", label: "delimiter:llama_token" },

  // Encoding evasion
  { regex: /\b(?:base64|rot13|hex)\s+(?:decode|encode|convert)\b/i, severity: "high", label: "evasion:encoding" },
  { regex: /\bdecode\s+(?:this|the\s+following)\s+(?:base64|hex)\b/i, severity: "high", label: "evasion:decode_request" },
];

const MEDIUM_SEVERITY_PATTERNS: PatternRule[] = [
  { regex: /\boverride\s+(?:your|the|safety|content)\b/i, severity: "medium", label: "suspicious:override" },
  { regex: /\bbypass\s+(?:your|the|safety|content|filter)\b/i, severity: "medium", label: "suspicious:bypass" },
  { regex: /\bwhat\s+were\s+you\s+told\b/i, severity: "medium", label: "suspicious:what_told" },
  { regex: /\brepeat\s+back\s+(?:your|the|everything)\b/i, severity: "medium", label: "suspicious:repeat_back" },
  { regex: /\bjailbreak\b/i, severity: "medium", label: "suspicious:jailbreak" },
  { regex: /\bDAN\s+mode\b/i, severity: "medium", label: "suspicious:dan_mode" },
];

/**
 * Scan text for known prompt injection patterns.
 *
 * Returns on first high-severity match (short-circuit).
 * Scans all medium patterns if no high found.
 */
export function scanForInjection(text: string): InjectionScanResult {
  // Short-circuit: high severity
  for (const rule of HIGH_SEVERITY_PATTERNS) {
    if (rule.regex.test(text)) {
      return { flagged: true, severity: "high", pattern: rule.label };
    }
  }

  // Medium severity
  for (const rule of MEDIUM_SEVERITY_PATTERNS) {
    if (rule.regex.test(text)) {
      return { flagged: true, severity: "medium", pattern: rule.label };
    }
  }

  return { flagged: false, severity: "none" };
}
