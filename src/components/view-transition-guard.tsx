"use client";

import { useEffect } from "react";

/** React 19 / Next navigations can skip an in-flight view transition (benign). */
export function ViewTransitionGuard() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { name?: string; message?: string } | undefined;
      if (
        reason?.name === "AbortError" &&
        String(reason.message ?? "").includes("Transition was skipped")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  return null;
}
