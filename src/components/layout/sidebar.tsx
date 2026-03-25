"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { parseTimestamp } from "@/lib/utils/timestamp";
import { AuthService } from "@/lib/services/auth.service";
import { useWorkspaceDocs } from "@/context/workspace-docs-context";
import { FileText, LogOut, Moon, PanelLeftClose, Plus, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function DocLinks(props: { onPick?: () => void }) {
  const pathname = usePathname();
  const { docs, loading } = useWorkspaceDocs();

  if (loading && docs.length === 0) {
    return (
      <div className="space-y-2 px-3">
        <div className="h-7 rounded-md bg-muted/50 motion-safe:animate-pulse" />
        <div className="h-7 w-3/4 rounded-md bg-muted/50 motion-safe:animate-pulse" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <p className="px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        No files yet. Hit &ldquo;New&rdquo; up top or the plus below.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5 text-sm">
      {docs.map((d) => {
        const active = pathname === `/document/${d.id}`;
        return (
          <li key={d.id}>
            <Link
              href={`/document/${d.id}`}
              onClick={() => props.onPick?.()}
              className={cn(
                "block rounded-md px-3 py-2 transition-colors",
                active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span className="line-clamp-2 break-words">{d.title || "Untitled"}</span>
              <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                {formatDistanceToNow(parseTimestamp(d.updatedAt), { addSuffix: true })}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarChrome(props: {
  mobile?: boolean;
  onCloseMobile?: () => void;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const { createDoc, creating } = useWorkspaceDocs();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 lg:h-[60px]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={() => props.onCloseMobile?.()}
        >
          <FileText className="h-5 w-5 text-primary" />
          <span>Mini Docs</span>
        </Link>
        {props.mobile && props.onCloseMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={props.onCloseMobile}
            aria-label="Close menu"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border-b px-3 py-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full gap-2"
          disabled={creating}
          onClick={() => {
            void createDoc();
          }}
        >
          <Plus className="h-4 w-4" />
          {creating ? "Working…" : "New document"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Your files
        </p>
        <DocLinks onPick={props.onCloseMobile} />
      </div>

      <div className="mt-auto space-y-1 border-t p-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setTheme(dark ? "light" : "dark")}
        >
          {dark ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          Theme
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={() => AuthService.logout()}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </Button>
      </div>
    </>
  );
}

export function Sidebar(props: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    if (pathRef.current !== pathname) {
      props.onMobileClose();
      pathRef.current = pathname;
    }
  }, [pathname, props.onMobileClose]);

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-muted/25 md:flex lg:w-72">
        <SidebarChrome />
      </aside>

      {props.mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Dismiss navigation"
            onClick={props.onMobileClose}
          />
          <aside className="absolute top-0 left-0 flex h-full w-[min(20rem,92vw)] flex-col border-r bg-background shadow-xl">
            <SidebarChrome mobile onCloseMobile={props.onMobileClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
