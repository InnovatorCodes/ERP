"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; icon?: LucideIcon }[]
  className?: string
  "aria-label"?: string
}

/** A small set of mutually exclusive choices, e.g. Sofa / Bed or List / Board. */
function SegmentedControl<T extends string>({ value, onChange, options, className, ...props }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={props["aria-label"]} className={cn("inline-flex rounded-lg border bg-muted p-1", className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.icon && <option.icon className="size-4" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
