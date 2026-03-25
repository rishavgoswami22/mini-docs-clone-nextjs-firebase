"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Link2,
  Share2,
  Loader2,
  Cloud,
  Check,
  Download,
  Trash2,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { useRealtimeDocument } from "@/hooks/use-realtime-document";
import { useAutoSave } from "@/hooks/use-auto-save";
import { PlateEditor } from "@/components/editor/plate-editor";
import { useAuth } from "@/context/auth-context";
import { DocumentService } from "@/lib/services/document.service";
import { canEditDocument, isDocumentOwner } from "@/lib/utils/doc-access";
import { normalize, fingerprint } from "@/lib/utils/plate-normalize";
import { friendlyError } from "@/lib/utils/error-messages";
import type { PlateContent } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EMPTY: PlateContent = [
  { type: "p", children: [{ text: "" }] },
] as unknown as PlateContent;

export default function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { document, loading } = useRealtimeDocument(docId);
  const { saveStatus, triggerSave } = useAutoSave();

  const [title, setTitle] = useState("Untitled");
  const [content, setContent] = useState<PlateContent>(EMPTY);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const localTitleRef = useRef("");
  const localContentFpRef = useRef("");

  const editable = useMemo(
    () => (document && user ? canEditDocument(document, user) : false),
    [document, user]
  );

  const owner = useMemo(
    () => (document && user ? isDocumentOwner(document, user) : false),
    [document, user]
  );

  useEffect(() => {
    if (!document) return;

    const remoteTitle = document.title?.trim() || "Untitled";
    const remoteContent = normalize(
      (document.content as PlateContent) ?? EMPTY
    );
    const remoteFp = fingerprint(remoteContent);

    if (remoteTitle !== localTitleRef.current) {
      localTitleRef.current = remoteTitle;
      setTitle(remoteTitle);
    }

    if (remoteFp !== localContentFpRef.current) {
      localContentFpRef.current = remoteFp;
      setContent(remoteContent);
    }
  }, [document]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) return;
    const next = e.target.value;
    setTitle(next);
    localTitleRef.current = next;
    triggerSave(docId, { title: next });
  };

  const handleContentChange = (nextContent: PlateContent) => {
    if (!editable) return;
    const clean = normalize(nextContent);
    const fp = fingerprint(clean);
    localContentFpRef.current = fp;
    triggerSave(docId, { content: clean });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/document/${docId}`
      );
      toast.success("Link copied");
    } catch {
      toast.error("Clipboard blocked — copy from the address bar");
    }
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Need a real email");
      return;
    }
    setInviteBusy(true);
    try {
      await DocumentService.shareDocument(docId, email, "editor");

      const docUrl = `${window.location.origin}/document/${docId}`;
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            docTitle: title,
            docUrl,
            inviterEmail: user?.email ?? "Someone",
          }),
        });
        const body = await res.json().catch(() => ({}));

        if (body.emailSent) {
          toast.success(`Invite emailed to ${email}`);
        } else {
          toast.success(`Shared with ${email} — they can open the link once logged in`);
        }
      } catch {
        toast.success(`Shared with ${email} — email notification skipped`);
      }

      setInviteEmail("");
      setShareOpen(false);
    } catch (err) {
      toast.error(friendlyError(err, "Could not share. Try again."));
    } finally {
      setInviteBusy(false);
    }
  };

  const submitRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameTitle.trim();
    if (!trimmed || trimmed === title) {
      setRenameOpen(false);
      return;
    }
    setRenameBusy(true);
    try {
      await DocumentService.updateDocument(docId, { title: trimmed });
      localTitleRef.current = trimmed;
      setTitle(trimmed);
      toast.success("Renamed");
      setRenameOpen(false);
    } catch {
      toast.error("Rename failed");
    } finally {
      setRenameBusy(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await DocumentService.deleteDocument(docId);
      toast.success("Document deleted");
      router.replace("/dashboard");
    } catch {
      toast.error("Could not delete. Try again.");
      setDeleteBusy(false);
    }
  };

  const downloadPdf = () => {
    const editorEl = window.document.querySelector("[data-slate-editor]");
    if (!editorEl) {
      toast.error("Editor not found");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) {
      toast.error("Popup blocked — allow popups and try again");
      return;
    }

    const isDark = window.document.documentElement.classList.contains("dark");

    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Inter, -apple-system, sans-serif;
      padding: 48px 56px;
      color: ${isDark ? "#111" : "#111"};
      background: #fff;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 28px; font-weight: 700; margin: 0 0 24px; padding-bottom: 12px; border-bottom: 2px solid #e5e5e5; }
    h2 { font-size: 22px; font-weight: 600; margin: 24px 0 8px; }
    p { margin: 0 0 12px; }
    ul, ol { margin: 0 0 16px; padding-left: 24px; }
    li { margin-bottom: 4px; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    u { text-decoration: underline; }
    @media print {
      body { padding: 0; }
      @page { margin: 1in 0.75in; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${editorEl.innerHTML}
</body>
</html>`);
    printWin.document.close();

    setTimeout(() => {
      printWin.print();
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Loading doc…</p>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="flex min-h-0 flex-col">
      <header className="sticky top-0 z-10 mb-4 flex flex-col gap-3 border-b bg-background/95 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            aria-label="Back"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            disabled={!editable}
            className="min-w-0 flex-1 truncate bg-transparent text-lg font-semibold outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1 disabled:cursor-default disabled:opacity-70"
            placeholder="Untitled"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex flex-wrap items-center gap-1.5">
            {!editable && (
              <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                View only
              </span>
            )}

            <Button type="button" variant="outline" size="sm" onClick={downloadPdf}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              PDF
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
              <Link2 className="mr-1.5 h-3.5 w-3.5" />
              Copy link
            </Button>

            {owner && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Invite
              </Button>
            )}

            {owner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="px-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameTitle(title);
                      setRenameOpen(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-2">
            {editable && saveStatus === "idle" && (
              <>
                <Cloud className="h-3.5 w-3.5 opacity-70" />
                <span>Synced</span>
              </>
            )}
            {editable && saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-amber-600 dark:text-amber-500">Saving…</span>
              </>
            )}
            {editable && saveStatus === "saved" && (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Saved</span>
              </>
            )}
            {editable && saveStatus === "error" && (
              <span className="text-destructive">Save error</span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl">
        <PlateEditor
          documentId={docId}
          initialContent={content}
          onChange={handleContentChange}
          editable={editable}
        />
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Share</DialogTitle>
            <DialogDescription>
              They need an account with this email. Gets editor access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void submitInvite(e)} className="grid gap-3">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoComplete="off"
            />
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setShareOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteBusy}>
                {inviteBusy ? "Sending…" : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void submitRename(e)} className="grid gap-3">
            <Input
              autoFocus
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Document title"
            />
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renameBusy}>
                {renameBusy ? "Saving…" : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This permanently deletes &ldquo;{title}&rdquo;. Can&apos;t undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
