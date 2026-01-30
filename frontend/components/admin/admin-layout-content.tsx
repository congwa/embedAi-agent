"use client";

import { useSetupGuard } from "@/components/providers/setup-guard-provider";
import { AdminSidebar } from "@/components/admin";

interface AdminLayoutContentProps {
  children: React.ReactNode;
}

export function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  const { isSetupCompleted, isOnSetupPage } = useSetupGuard();

  const showSidebar = isSetupCompleted || isOnSetupPage === false;

  if (!showSidebar || isOnSetupPage) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <AdminSidebar />
      <main className="ml-64 min-h-screen p-6">{children}</main>
    </div>
  );
}
