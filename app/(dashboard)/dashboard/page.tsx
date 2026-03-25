"use client";

import { useAuth } from "@/context/auth-context";
import { useWorkspaceDocs } from "@/context/workspace-docs-context";
import { DocumentCard } from "@/components/dashboard/document-card";
import { Button } from "@/components/ui/button";
import { Plus, Files } from "lucide-react";
import { isDocumentOwner } from "@/lib/utils/doc-access";

export default function DashboardPage() {
  const { user } = useAuth();
  const { docs, loading, creating, createDoc, trashDoc } = useWorkspaceDocs();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            All your docs live in the sidebar too. This grid is just easier to skim.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void createDoc()}
          disabled={creating}
          className="shrink-0 gap-2"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "Blank doc"}
        </Button>
      </div>

      {docs.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={
                user && isDocumentOwner(doc, user)
                  ? () => void trashDoc(doc.id)
                  : undefined
              }
            />
          ))}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-52 rounded-xl bg-muted/40 motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <Files className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">Nothing here</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Hit the button above or use the sidebar.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => void createDoc()}
            disabled={creating}
          >
            Start one
          </Button>
        </div>
      )}
    </div>
  );
}
