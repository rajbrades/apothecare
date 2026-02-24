import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
