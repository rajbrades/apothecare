import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events for subscription lifecycle management.
 * Verifies webhook signature, checks idempotency, and updates practitioner tier.
 *
 * Events handled:
 * - checkout.session.completed → upgrade to pro, store Stripe IDs
 * - customer.subscription.updated → sync tier and status
 * - customer.subscription.deleted → downgrade to free
 * - invoice.payment_failed → mark subscription as past_due
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET || !WEBHOOK_SECRET) {
    console.error("[Stripe Webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return jsonError("Webhook not configured", 500);
  }

  const stripe = new Stripe(STRIPE_SECRET);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonError("Missing stripe-signature header", 400);
  }

  // ── Verify webhook signature ────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Webhook] Signature verification failed:", message);
    return jsonError("Invalid signature", 400);
  }

  const supabase = createServiceClient();

  // ── Idempotency check ───────────────────────────────────────────────
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single();

  if (existing) {
    // Already processed — return 200 so Stripe doesn't retry
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ── Process event ───────────────────────────────────────────────────
  let error: string | null = null;
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown processing error";
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
  }

  // ── Record event for idempotency ────────────────────────────────────
  await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload_summary: { livemode: event.livemode },
    error,
  });

  if (error) {
    // Return 500 so Stripe retries (up to 3 days)
    return jsonError("Event processing failed", 500);
  }

  return NextResponse.json({ received: true });
}

// ── Event Handlers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

async function handleCheckoutCompleted(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const practitionerId = session.metadata?.practitioner_id;
  if (!practitionerId) {
    console.warn("[Stripe Webhook] checkout.session.completed missing practitioner_id in metadata");
    return;
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  const { error } = await supabase
    .from("practitioners")
    .update({
      subscription_tier: "pro",
      subscription_status: "active",
      stripe_customer_id: customerId ?? null,
      stripe_subscription_id: subscriptionId ?? null,
    })
    .eq("id", practitionerId);

  if (error) throw new Error(`Failed to upgrade practitioner ${practitionerId}: ${error.message}`);

  await auditSubscriptionChange(supabase, practitionerId, "upgrade", {
    event: "checkout.session.completed",
    new_tier: "pro",
    stripe_customer_id: customerId,
  });

  console.log(`[Stripe Webhook] Practitioner ${practitionerId} upgraded to pro`);
}

async function handleSubscriptionUpdated(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id, subscription_tier")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!practitioner) {
    console.warn(`[Stripe Webhook] No practitioner found for customer ${customerId}`);
    return;
  }

  const status = mapStripeStatus(subscription.status);
  const tier = subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free";

  const { error } = await supabase
    .from("practitioners")
    .update({
      subscription_tier: tier,
      subscription_status: status,
    })
    .eq("id", practitioner.id);

  if (error) throw new Error(`Failed to update subscription for ${practitioner.id}: ${error.message}`);

  await auditSubscriptionChange(supabase, practitioner.id, "update", {
    event: "customer.subscription.updated",
    new_tier: tier,
    new_status: status,
    stripe_status: subscription.status,
  });

  console.log(`[Stripe Webhook] Practitioner ${practitioner.id} subscription updated: ${tier}/${status}`);
}

async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!practitioner) return;

  const { error } = await supabase
    .from("practitioners")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      stripe_subscription_id: null,
    })
    .eq("id", practitioner.id);

  if (error) throw new Error(`Failed to downgrade ${practitioner.id}: ${error.message}`);

  await auditSubscriptionChange(supabase, practitioner.id, "update", {
    event: "customer.subscription.deleted",
    new_tier: "free",
    new_status: "canceled",
  });

  console.log(`[Stripe Webhook] Practitioner ${practitioner.id} downgraded to free (subscription deleted)`);
}

async function handlePaymentFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!practitioner) return;

  const { error } = await supabase
    .from("practitioners")
    .update({ subscription_status: "past_due" })
    .eq("id", practitioner.id);

  if (error) throw new Error(`Failed to mark past_due for ${practitioner.id}: ${error.message}`);

  await auditSubscriptionChange(supabase, practitioner.id, "update", {
    event: "invoice.payment_failed",
    new_status: "past_due",
    invoice_id: invoice.id,
  });

  console.log(`[Stripe Webhook] Practitioner ${practitioner.id} marked past_due (payment failed)`);
}

// ── Helpers ─────────────────────────────────────────────────────────────

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due": return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default: return "active";
  }
}

async function auditSubscriptionChange(
  supabase: SupabaseClient,
  practitionerId: string,
  action: string,
  detail: Record<string, unknown>
) {
  await supabase
    .from("audit_logs")
    .insert({
      practitioner_id: practitionerId,
      action,
      resource_type: "subscription",
      ip_address: "stripe-webhook",
      user_agent: "Stripe/webhook",
      detail,
    })
    .catch((err: unknown) => {
      console.error("[Stripe Webhook] Audit log failed:", err);
    });
}
