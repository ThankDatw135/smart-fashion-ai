"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg pr-8 group-data-[type=success]:text-primary",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          icon: "group-data-[type=success]:text-primary",
          closeButton:
            "group-[.toast]:!left-auto group-[.toast]:!right-2 group-[.toast]:!top-1/2 group-[.toast]:!-translate-y-1/2 group-[.toast]:!bg-transparent group-[.toast]:!border-none group-[.toast]:!text-muted-foreground group-hover-[.toast]:!text-foreground transition-colors",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
