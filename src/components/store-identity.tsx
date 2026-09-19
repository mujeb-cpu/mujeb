import { cn } from "@/lib/utils";

/** Compact Saudi-green store mark — palm leaf nod to KSA ecommerce, not the official emblem. */
export function StoreMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-5";

  return (
    <span
      className={cn(
        "store-mark inline-grid shrink-0 place-items-center rounded-full text-white",
        dim,
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(
          size === "sm" ? "size-2.5" : size === "lg" ? "size-4" : "size-3",
        )}
      >
        {/* Stylized date palm — commercial KSA shorthand */}
        <path
          d="M12 20.5V11.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M12 12c-2.2-1.6-4.6-2-6.2-1.6.8-1.4 2.6-2.6 5-3.1C9.6 5.8 8.4 4.2 8 3c1.8.7 3.2 1.9 4 3.4C12.8 4.9 14.2 3.7 16 3c-.4 1.2-1.6 2.8-2.8 4.3 2.4.5 4.2 1.7 5 3.1-1.6-.4-4 .0-6.2 1.6Z"
          fill="currentColor"
        />
        <path
          d="M9.5 20.5h5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Store name with the Saudi-green mark — use anywhere the merchant identity shows. */
export function StoreIdentity({
  name,
  className,
  markSize = "md",
  markClassName,
}: {
  name: string;
  className?: string;
  markSize?: "sm" | "md" | "lg";
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <StoreMark size={markSize} className={markClassName} />
      <span>{name}</span>
    </span>
  );
}
