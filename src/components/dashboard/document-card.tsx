"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { parseTimestamp } from "@/lib/utils/timestamp";
import { FileText, MoreVertical, Trash2, Edit2, Pencil } from "lucide-react";
import { DocumentData } from "@/types";
import { DocumentService } from "@/lib/services/document.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentCardProps {
  document: DocumentData;
  onDelete?: () => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(document.title);
  const [renaming, setRenaming] = useState(false);

  const handleOpen = () => {
    router.push(`/document/${document.id}`);
  };

  const submitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === document.title) {
      setRenameOpen(false);
      return;
    }
    setRenaming(true);
    try {
      await DocumentService.updateDocument(document.id, { title: trimmed });
      toast.success("Renamed");
      setRenameOpen(false);
    } catch {
      toast.error("Could not rename. Try again.");
    } finally {
      setRenaming(false);
    }
  };

  return (
    <>
      <div
        className="group flex flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-md transition-all cursor-pointer"
        onClick={handleOpen}
      >
        <div className="h-40 bg-muted/50 p-4 flex items-start justify-center overflow-hidden border-b">
          <FileText className="h-16 w-16 text-muted-foreground/30 mt-4 group-hover:scale-110 transition-transform duration-300" />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold line-clamp-1 flex-1" title={document.title}>
              {document.title || "Untitled"}
            </h3>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleOpen}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewTitle(document.title);
                      setRenameOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
            {formatDistanceToNow(parseTimestamp(document.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void submitRename(e)} className="grid gap-3">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Document title"
            />
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renaming}>
                {renaming ? "Saving…" : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
