"use client"

import * as React from "react"
import ReactTextareaAutosize, {
  TextareaAutosizeProps as ReactTextareaAutosizeProps
} from "react-textarea-autosize"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "style"> {
  minRows?: number
  maxRows?: number
  onValueChange?: (value: string) => void
}

const TextareaAutosize = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minRows = 1, maxRows = 5, onValueChange, ...props }, ref) => {
    return (
      <ReactTextareaAutosize
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        minRows={minRows}
        maxRows={maxRows}
        ref={ref}
        onChange={e => {
          if (onValueChange) {
            onValueChange(e.target.value)
          }
          if (props.onChange) {
            props.onChange(e)
          }
        }}
        {...props}
      />
    )
  }
)
TextareaAutosize.displayName = "TextareaAutosize"

export { TextareaAutosize }
