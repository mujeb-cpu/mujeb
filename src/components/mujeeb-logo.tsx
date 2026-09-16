import { cn } from "@/lib/utils";

export function MujeebMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      <path d="M6 2.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z" />
      <path d="M14 2.5V6.5h4" />
      <path d="M8.5 13.5l2 2 4-4" />
    </svg>
  );
}

export function MujeebLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MujeebMark className="size-6 text-primary" />
      {showText && (
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          Mujeeb
        </span>
      )}
    </div>
  );
}
