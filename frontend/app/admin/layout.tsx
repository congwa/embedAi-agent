import { SetupGuardProvider } from "@/components/providers/setup-guard-provider";
import { AdminLayoutContent } from "@/components/admin/admin-layout-content";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SetupGuardProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SetupGuardProvider>
  );
}
