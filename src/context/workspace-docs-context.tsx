"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { DocumentService } from "@/lib/services/document.service";
import type { DocumentData } from "@/types";

type Ctx = {
  docs: DocumentData[];
  loading: boolean;
  creating: boolean;
  createDoc: () => Promise<void>;
  trashDoc: (id: string) => Promise<void>;
};

const WorkspaceDocsContext = createContext<Ctx | null>(null);

export function WorkspaceDocsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const gen = useRef(0);

  useEffect(() => {
    const uid = user?.uid;
    const email = user?.email ?? null;

    if (!uid) {
      setDocs([]);
      setLoading(false);
      return;
    }

    const myGen = ++gen.current;
    setLoading(true);

    const off = DocumentService.subscribeToUserDocuments(
      uid,
      email,
      (next) => {
        if (gen.current !== myGen) return;
        setDocs(next);
        setLoading(false);
      },
      () => {
        if (gen.current !== myGen) return;
        setLoading(false);
        toast.error("Could not load documents.");
      }
    );

    return () => {
      gen.current += 1;
      off();
    };
  }, [user?.uid, user?.email]);

  const createDoc = useCallback(async () => {
    if (!user) return;
    setCreating(true);
    try {
      const row = await DocumentService.createDocument(user.uid, user.email || "");
      toast.success("Created");
      router.push(`/document/${row.id}`);
    } catch {
      toast.error("Could not create document");
    } finally {
      setCreating(false);
    }
  }, [router, user]);

  const trashDoc = useCallback(async (id: string) => {
    try {
      await DocumentService.deleteDocument(id);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }, []);

  const value = useMemo(
    () => ({ docs, loading, creating, createDoc, trashDoc }),
    [docs, loading, creating, createDoc, trashDoc]
  );

  return (
    <WorkspaceDocsContext.Provider value={value}>
      {children}
    </WorkspaceDocsContext.Provider>
  );
}

export function useWorkspaceDocs() {
  const ctx = useContext(WorkspaceDocsContext);
  if (!ctx) throw new Error("useWorkspaceDocs outside provider");
  return ctx;
}
