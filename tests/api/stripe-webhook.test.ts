import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Stripe webhook handler unit tests.
 *
 * Tests cover:
 * - Signature verification (rejects invalid signatures)
 * - Missing configuration (returns 500)
 * - Idempotency (duplicate events return 200 without re-processing)
 * - Event routing (correct handler called per event type)
 * - Tier transitions (free → pro on checkout, pro → free on delete)
 */

// ── Mock Stripe ─────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: mockConstructEvent,
      },
    })),
  };
});

// ── Mock Supabase ───────────────────────────────────────────────────────

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockSelectSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "stripe_webhook_events") {
        return {
          select: () => ({
            eq: () => ({
              single: mockSelectSingle,
            }),
          }),
          insert: mockInsert,
        };
      }
      if (table === "practitioners") {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: { id: "prac-123", subscription_tier: "free" },
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      if (table === "audit_logs") {
        return { insert: vi.fn().mockReturnValue({ catch: vi.fn() }) };
      }
      return {};
    },
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRequest(body: string, signature = "valid-sig"): Request {
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "stripe-signature": signature,
      "content-type": "application/json",
    },
    body,
  });
}

function makeStripeEvent(type: string, data: Record<string, unknown> = {}): {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
} {
  return {
    id: `evt_${Date.now()}`,
    type,
    livemode: false,
    data: { object: data },
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe("Stripe Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: event not yet processed
    mockSelectSingle.mockResolvedValue({ data: null });
    // Set env vars
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_xxx";
  });

  describe("Signature Verification", () => {
    it("rejects requests without stripe-signature header", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      });

      // Import dynamically so env vars are set
      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(req as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("stripe-signature");
    });

    it("rejects invalid signatures", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest("{}", "invalid-sig") as any);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Invalid signature");
    });
  });

  describe("Idempotency", () => {
    it("returns 200 for duplicate events without re-processing", async () => {
      const event = makeStripeEvent("checkout.session.completed");
      mockConstructEvent.mockReturnValue(event);
      // Event already processed
      mockSelectSingle.mockResolvedValue({ data: { id: "existing" } });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest("{}") as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.duplicate).toBe(true);
      // Should NOT have called update on practitioners
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Event Handling", () => {
    it("handles checkout.session.completed → upgrades to pro", async () => {
      const event = makeStripeEvent("checkout.session.completed", {
        metadata: { practitioner_id: "prac-123" },
        customer: "cus_xxx",
        subscription: "sub_xxx",
      });
      mockConstructEvent.mockReturnValue(event);

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest("{}") as any);
      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: "pro",
          subscription_status: "active",
          stripe_customer_id: "cus_xxx",
          stripe_subscription_id: "sub_xxx",
        })
      );
    });

    it("handles customer.subscription.deleted → downgrades to free", async () => {
      const event = makeStripeEvent("customer.subscription.deleted", {
        customer: "cus_xxx",
        status: "canceled",
      });
      mockConstructEvent.mockReturnValue(event);

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest("{}") as any);
      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_tier: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
      );
    });

    it("handles invoice.payment_failed → marks past_due", async () => {
      const event = makeStripeEvent("invoice.payment_failed", {
        customer: "cus_xxx",
        id: "inv_xxx",
      });
      mockConstructEvent.mockReturnValue(event);

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest("{}") as any);
      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_status: "past_due" })
      );
    });

    it("records event in idempotency table", async () => {
      const event = makeStripeEvent("checkout.session.completed", {
        metadata: { practitioner_id: "prac-123" },
        customer: "cus_xxx",
        subscription: "sub_xxx",
      });
      mockConstructEvent.mockReturnValue(event);

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      await POST(makeRequest("{}") as any);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_event_id: event.id,
          event_type: "checkout.session.completed",
          error: null,
        })
      );
    });
  });

  describe("Missing Configuration", () => {
    it("returns 500 when Stripe env vars are missing", async () => {
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      // Re-import to pick up missing env
      vi.resetModules();
      const mod = await import("@/app/api/webhooks/stripe/route");
      const res = await mod.POST(makeRequest("{}") as any);
      expect(res.status).toBe(500);
    });
  });
});
