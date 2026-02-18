"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-[var(--color-surface)] group-[.toaster]:text-[var(--color-text-primary)] group-[.toaster]:border-[var(--color-border)] group-[.toaster]:shadow-[var(--shadow-elevated)]",
                    description: "group-[.toast]:text-[var(--color-text-muted)]",
                    actionButton:
                        "group-[.toast]:bg-[var(--color-brand-600)] group-[.toast]:text-white",
                    cancelButton:
                        "group-[.toast]:bg-[var(--color-surface-tertiary)] group-[.toast]:text-[var(--color-text-secondary)]",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
