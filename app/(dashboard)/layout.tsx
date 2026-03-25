"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { WorkspaceDocsProvider } from "@/context/workspace-docs-context";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const closeMobile = useCallback(() => setMobileNav(false), []);

  return (
    <WorkspaceDocsProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <TopBar onOpenMobileNav={() => setMobileNav(true)} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar mobileOpen={mobileNav} onMobileClose={closeMobile} />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </WorkspaceDocsProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Hold on…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
