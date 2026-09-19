import { Suspense } from "react";
import { IntegrationsPage } from "@/views/integrations";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <IntegrationsPage />
    </Suspense>
  );
}
