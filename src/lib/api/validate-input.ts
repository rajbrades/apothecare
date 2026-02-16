import type { NextRequest } from "next/server";
import { scanForInjection } from "@/lib/security/prompt-guard";
import { auditLog } from "@/lib/api/audit";

export class PromptInjectionError extends Error {
  constructor(message: string = "Input blocked by security filter") {
    super(message);
    this.name = "PromptInjectionError";
  }
}

/**
 * Scan user input for prompt injection attempts.
 *
 * - High severity: logs `prompt_injection_blocked` and throws (route returns 400)
 * - Medium severity: logs `prompt_injection_warning` and continues
 * - None: no-op
 */
export function validateInputSafety(
  text: string,
  context: {
    request: NextRequest;
    practitionerId: string;
    resourceType: string;
    resourceId?: string;
  }
): void {
  const result = scanForInjection(text);

  if (!result.flagged) return;

  if (result.severity === "high") {
    auditLog({
      request: context.request,
      practitionerId: context.practitionerId,
      action: "prompt_injection_blocked",
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      detail: { pattern: result.pattern, severity: result.severity },
    });

    throw new PromptInjectionError();
  }

  if (result.severity === "medium") {
    auditLog({
      request: context.request,
      practitionerId: context.practitionerId,
      action: "prompt_injection_warning",
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      detail: { pattern: result.pattern, severity: result.severity },
    });
  }
}
