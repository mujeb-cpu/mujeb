import { cn } from "@/lib/utils";
import { Store } from "lucide-react";

/** Neutral store icon when a merchant logo is unavailable. */
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
      <Store className={size === "lg" ? "size-4" : "size-3"} strokeWidth={1.7} />
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
      <bdi className="truncate">{name}</bdi>
    </span>
  );
}
