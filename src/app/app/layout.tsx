import { MerchantLayout } from "@/layouts/merchant-layout";

export default function AppWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MerchantLayout>{children}</MerchantLayout>;
}
