import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div
      key={location.pathname}
      className={cn(
        "transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-2 blur-[2px]",
      )}
    >
      {children}
    </div>
  );
}
