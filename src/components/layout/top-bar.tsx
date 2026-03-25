"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function TopBar(props: { onOpenMobileNav: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-muted/20 px-3 sm:px-6 lg:h-[60px]">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={props.onOpenMobileNav}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link
          href="/dashboard"
          className="truncate text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
        >
          Dashboard
        </Link>
      </div>

      {user && (
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {user.email}
          </span>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
            title={user.email ?? ""}
          >
            {(user.displayName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}
