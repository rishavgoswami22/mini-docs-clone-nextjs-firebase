"use client";

import { useEffect, useState } from "react";
import { DocumentService } from "@/lib/services/document.service";
import { DocumentData } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useRealtimeDocument(docId: string) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const off = DocumentService.subscribeToDocument(
      docId,
      (docData) => {
        if (docData) {
          setDocument(docData);
        } else {
          toast.error("No such document");
          router.replace("/dashboard");
        }
        setLoading(false);
      },
      () => {
        toast.error("No access or network issue");
        router.replace("/dashboard");
        setLoading(false);
      }
    );

    return () => off();
  }, [docId, router]);

  return { document, loading };
}
