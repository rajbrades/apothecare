import { Logomark } from "@/components/ui/logomark";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-light)] py-12 bg-[var(--color-surface)]">
      <div className="max-w-5xl mx-auto px-6 text-center text-sm text-[var(--color-text-muted)]">
        <div className="flex justify-center mb-4">
          <Logomark size="xs" />
        </div>
        <p>&copy; {new Date().getFullYear()} Apotheca. All rights reserved.</p>
        <p className="mt-2">
          Apotheca is a clinical decision support tool. It is not a substitute for
          professional medical judgment. All treatment decisions remain with the licensed
          practitioner.
        </p>
      </div>
    </footer>
  );
}
