"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const params = new URLSearchParams({ auth: "1" });
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) params.set("returnUrl", returnUrl);
    router.replace(`/?${params.toString()}`);
  }, [router, searchParams]);
  return null;
}
