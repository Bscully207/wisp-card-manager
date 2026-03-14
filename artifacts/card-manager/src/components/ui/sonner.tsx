"use client"

import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function useResolvedTheme(): "light" | "dark" {
  const { theme } = useTheme()
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  })

  useEffect(() => {
    if (theme !== "system") {
      setResolved(theme)
      return
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    setResolved(mql.matches ? "dark" : "light")
    const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? "dark" : "light")
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [theme])

  return resolved
}

const Toaster = ({ ...props }: ToasterProps) => {
  const resolvedTheme = useResolvedTheme()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
