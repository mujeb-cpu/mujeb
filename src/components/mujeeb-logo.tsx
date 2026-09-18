import { useId } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";

/**
 * Mujeeb mark: a chat bubble whose counter is a return arrow — the brand's
 * two ideas (a conversation, a return) in one shape. Drawn as solid fills so
 * it stays legible at favicon size; `currentColor` lets it take the theme.
 */
export function MujeebMark({ className }: { className?: string }) {
  // The mark renders several times per page; ids must not collide.
  const maskId = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      {/* Bubble, tail at the lower left. */}
      <path
        fill="currentColor"
        mask={`url(#${maskId})`}
        d="M16 2.5c7.18 0 13 5.6 13 12.5 0 6.9-5.82 12.5-13 12.5H8.6l-3.94 3.2A1 1 0 0 1 3 29.93V15C3 8.1 8.82 2.5 16 2.5Z"
      />
      {/* Arrow is knocked out via a mask, so it shows whatever surface sits
          behind the mark — sidebar, card, or page — with no colour seam. */}
      <mask id={maskId}>
        <rect width="32" height="32" fill="#fff" />
        <path
          fill="none"
          stroke="#000"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.4 14.2h5.9a4.3 4.3 0 0 1 0 8.6h-1.2"
        />
        <path
          fill="#000"
          d="M14.15 9.62a.9.9 0 0 1 1.32.8v7.56a.9.9 0 0 1-1.32.8l-4.02-3.78a.9.9 0 0 1 0-1.6l4.02-3.78Z"
        />
      </mask>
    </svg>
  );
}

export function MujeebLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MujeebMark className="size-7 text-primary" />
      {showText && (
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          {t("Mujeeb", "مجيب")}
        </span>
      )}
    </div>
  );
}
