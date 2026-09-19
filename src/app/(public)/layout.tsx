import { Suspense } from "react";
import { PublicLayout } from "@/layouts/public-layout";

export default function PublicRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <PublicLayout>{children}</PublicLayout>
    </Suspense>
  );
}
