"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Practitioner } from "@/types/database";

interface BrandingSectionProps {
  practitioner: Practitioner;
}

export function BrandingSection({ practitioner }: BrandingSectionProps) {
  const [logoPath, setLogoPath] = useState(practitioner.logo_storage_path);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchLogoUrl = useCallback(async () => {
    if (!logoPath) { setLogoUrl(null); return; }
    try {
      const res = await fetch("/api/practitioners/logo");
      if (!res.ok) { setLogoUrl(null); return; }
      const data = await res.json();
      setLogoUrl(data.url);
    } catch {
      setLogoUrl(null);
    }
  }, [logoPath]);

  useEffect(() => { fetchLogoUrl(); }, [fetchLogoUrl]);

  const [addressLine1, setAddressLine1] = useState(practitioner.practice_address_line1 || "");
  const [addressLine2, setAddressLine2] = useState(practitioner.practice_address_line2 || "");
  const [city, setCity] = useState(practitioner.practice_city || "");
  const [state, setState] = useState(practitioner.practice_state || "");
  const [zip, setZip] = useState(practitioner.practice_zip || "");
  const [phone, setPhone] = useState(practitioner.practice_phone || "");
  const [fax, setFax] = useState(practitioner.practice_fax || "");
  const [website, setWebsite] = useState(practitioner.practice_website || "");
  const [saving, setSaving] = useState(false);

  const hasChanges =
    addressLine1 !== (practitioner.practice_address_line1 || "") ||
    addressLine2 !== (practitioner.practice_address_line2 || "") ||
    city !== (practitioner.practice_city || "") ||
    state !== (practitioner.practice_state || "") ||
    zip !== (practitioner.practice_zip || "") ||
    phone !== (practitioner.practice_phone || "") ||
    fax !== (practitioner.practice_fax || "") ||
    website !== (practitioner.practice_website || "");

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Accepted formats: PNG, JPEG, SVG, WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maximum file size is 2MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/practitioners/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to upload logo");
        return;
      }

      const data = await res.json();
      setLogoPath(data.logo_storage_path);
      // Fetch fresh signed URL for preview
      const urlRes = await fetch("/api/practitioners/logo");
      if (urlRes.ok) {
        const urlData = await urlRes.json();
        setLogoUrl(urlData.url);
      }
      toast.success("Logo uploaded");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleLogoDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/practitioners/logo", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to remove logo");
        return;
      }
      setLogoPath(null);
      setLogoUrl(null);
      toast.success("Logo removed");
    } catch {
      toast.error("Failed to remove logo");
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/practitioners/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice_address_line1: addressLine1 || null,
          practice_address_line2: addressLine2 || null,
          practice_city: city || null,
          practice_state: state || null,
          practice_zip: zip || null,
          practice_phone: phone || null,
          practice_fax: fax || null,
          practice_website: website || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Practice branding updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-surface)] outline-none focus:border-[var(--color-brand-400)] transition-all text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]";

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
      <h2 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        Practice Branding
      </h2>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-6">
        Your logo and practice info appear on exported PDF documents (visit notes, lab reports, supplement protocols).
      </p>

      {/* Logo Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Practice Logo
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] flex items-center justify-center bg-[var(--color-surface-secondary)] overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Practice logo"
                className="w-full h-full object-contain p-1.5"
              />
            ) : (
              <Upload className="w-5 h-5 text-[var(--color-text-muted)]" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                )}
                {logoPath ? "Replace Logo" : "Upload Logo"}
              </Button>
              {logoPath && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogoDelete}
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              PNG, JPEG, SVG, or WebP. Max 2MB. Displayed at max 56px height on exports.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Practice Address */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Address Line 1
          </label>
          <input
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="123 Main St, Suite 200"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Address Line 2
          </label>
          <input
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Building B"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Portland"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="OR"
              maxLength={2}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              ZIP
            </label>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="97201"
              maxLength={10}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(503) 555-0100"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
              Fax
            </label>
            <input
              type="tel"
              value={fax}
              onChange={(e) => setFax(e.target.value)}
              placeholder="(503) 555-0101"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://www.example.com"
            className={inputClass}
          />
        </div>
      </div>

      {hasChanges && (
        <div className="flex justify-end mt-6 pt-4 border-t border-[var(--color-border-light)]">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
