import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { isArabic, toggleLocale, t } = useLanguage();
  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      onClick={toggleLocale}
      className={cn("group rounded-full border border-transparent text-muted-foreground transition-all duration-200 hover:border-border hover:bg-background hover:text-foreground", !compact && "gap-2 px-3", className)}
      aria-label={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
      title={t("العربية", "English")}
    >
      <Languages className="size-4 transition-transform duration-300 group-hover:rotate-6" />
      {!compact && <span className="text-xs font-semibold">{isArabic ? "EN" : "عربي"}</span>}
    </Button>
  );
}
