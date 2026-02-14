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
                        "group toast group-[.toaster]:bg-white group-[.toaster]:text-[var(--color-text-primary)] group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-[var(--color-text-muted)]",
                    actionButton:
                        "group-[.toast]:bg-[var(--color-brand-600)] group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
