import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";

/**
 * Server-side guard to ensure the current user is an extensive admin.
 * Redirects to /login if not authenticated, or / if not an admin.
 */
export async function requireAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
        redirect("/login");
    }

    const adminEmails = (env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    if (adminEmails.length === 0) {
        console.warn("[Admin] ADMIN_EMAILS env var is not configured — all admin access denied");
    }

    if (!adminEmails.includes(user.email.toLowerCase())) {
        redirect("/");
    }

    return user;
}

/**
 * Boolean check for UI components (client or server)
 * Note: On client, this is insecure as it relies on passed-in email.
 * This is mostly for conditional rendering, actual protection must be server-side.
 */
export function isAdminEmail(email: string | null | undefined) {
    if (!email) return false;
    const adminEmails = (env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    if (adminEmails.length === 0) {
        console.warn("[Admin] ADMIN_EMAILS env var is not configured — all admin access denied");
    }
    return adminEmails.includes(email.toLowerCase());
}
