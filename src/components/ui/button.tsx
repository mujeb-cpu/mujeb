import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-none",
    "transition-[transform,background-color,border-color,color,opacity,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "[&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-[cubic-bezier(0.22,1,0.36,1)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_1px_2px_rgb(0_0_0_/0.06)]",
          "hover:bg-primary/90 hover:-translate-y-px",
          "hover:shadow-[0_4px_10px_-4px_rgb(0_0_0_/0.14)]",
          "active:translate-y-0 active:scale-[0.97] active:shadow-[0_1px_2px_rgb(0_0_0_/0.06)]",
        ].join(" "),
        destructive: [
          "bg-destructive text-white",
          "shadow-[0_1px_2px_rgb(0_0_0_/0.06)]",
          "hover:bg-destructive/90 hover:-translate-y-px",
          "focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
          "active:translate-y-0 active:scale-[0.97]",
        ].join(" "),
        outline: [
          "border bg-background shadow-xs",
          "hover:bg-accent hover:text-accent-foreground hover:-translate-y-px",
          "dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
          "active:translate-y-0 active:scale-[0.97]",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:-translate-y-px",
          "active:translate-y-0 active:scale-[0.97]",
        ].join(" "),
        ghost: [
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
          "active:scale-[0.97]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
