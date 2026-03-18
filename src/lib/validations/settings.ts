import { z } from "zod";

const LICENSE_TYPES = ["md", "do", "np", "aprn", "pa", "dc", "nd", "lac", "other"] as const;

export const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(1, "Name is required").max(200).optional(),
    license_type: z.enum(LICENSE_TYPES).optional(),
    license_number: z.string().max(50).nullable().optional(),
    license_state: z.string().max(2).nullable().optional(),
    npi: z.string().regex(/^\d{10}$/, "NPI must be exactly 10 digits").nullable().optional(),
    practice_name: z.string().max(200).nullable().optional(),
    practice_address_line1: z.string().max(200).nullable().optional(),
    practice_address_line2: z.string().max(200).nullable().optional(),
    practice_city: z.string().max(100).nullable().optional(),
    practice_state: z.string().max(2).nullable().optional(),
    practice_zip: z.string().max(10).nullable().optional(),
    practice_phone: z.string().max(20).nullable().optional(),
    practice_fax: z.string().max(20).nullable().optional(),
    practice_website: z.string().max(200).nullable().optional(),
    specialty_focus: z.array(z.string().max(100)).max(12).nullable().optional(),
    years_in_practice: z.number().int().min(0).max(80).nullable().optional(),
    default_note_template: z.enum(["soap", "history_physical", "consult", "follow_up"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT", {
    errorMap: () => ({ message: "Please type DELETE MY ACCOUNT to confirm" }),
  }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
