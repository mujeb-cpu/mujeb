import { CustomerLayout } from "@/layouts/customer-layout";

export default function CustomerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerLayout>{children}</CustomerLayout>;
}
