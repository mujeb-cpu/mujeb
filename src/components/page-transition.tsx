"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={cn(
        "transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-2 blur-[2px]",
      )}
    >
      {children}
    </div>
  );
}
