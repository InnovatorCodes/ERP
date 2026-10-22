"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationBarProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  /** Optional summary on the left, e.g. "124 orders". */
  summary?: string
  className?: string
}

function PaginationBar({ page, totalPages, onPageChange, disabled = false, summary, className }: PaginationBarProps) {
  const pages = Math.max(1, totalPages)
  return (
    <div className={cn("flex items-center justify-between gap-4 text-sm", className)}>
      <p className="text-muted-foreground">{summary}</p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground tabular-nums">
          Page {Math.min(page, pages)} of {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8 bg-card"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 bg-card"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= pages}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

export { PaginationBar }
