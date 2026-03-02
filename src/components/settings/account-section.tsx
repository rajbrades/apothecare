"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Practitioner } from "@/types/database";

interface AccountSectionProps {
  practitioner: Practitioner;
  userEmail: string;
  authProvider: string;
}

export function AccountSection({ practitioner, userEmail, authProvider }: AccountSectionProps) {
  const router = useRouter();
  const isEmailAuth = authProvider === "email";

  // ── Change Password ───────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Failed to change password");
        return;
      }

      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Delete Account ────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE MY ACCOUNT") return;

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete account");
        return;
      }

      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          Account & Security
        </h2>

        {isEmailAuth ? (
          <div className="space-y-4 max-w-sm">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
              Change Password
            </h3>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-red-600">{passwordError}</p>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword || !confirmPassword}
              size="sm"
            >
              {savingPassword && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Update Password
            </Button>
          </div>
        ) : (
          <div className="px-4 py-3 bg-[var(--color-surface-secondary)] rounded-[var(--radius-sm)] border border-[var(--color-border-light)]">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your account uses{" "}
              <span className="font-medium text-[var(--color-text-primary)]">
                {authProvider === "google" ? "Google Sign-In" : `${authProvider} authentication`}
              </span>
              . Password is managed by your identity provider.
            </p>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        </div>

        {!showDeleteConfirm ? (
          <div>
            <p className="text-sm text-red-600/80 mb-4">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              This will permanently delete your account, all patient data,
              conversations, lab results, and visit notes.
            </p>
            <div>
              <label className="block text-xs font-medium text-red-600 mb-1.5">
                Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full max-w-sm px-4 py-2.5 text-sm border border-red-300 rounded-[var(--radius-sm)] bg-white outline-none focus:border-red-400 transition-all text-[var(--color-text-primary)] placeholder:text-red-300 font-[var(--font-mono)]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== "DELETE MY ACCOUNT" || deleting}
              >
                {deleting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Permanently Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
