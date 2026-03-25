"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentService } from "@/lib/services/document.service";
import type { SaveStatus, DocumentData } from "@/types";
import { friendlyError } from "@/lib/utils/error-messages";
import { toast } from "sonner";

const DEBOUNCE_MS = 2000;
const MAX_WAIT_MS = 8000;

export function useAutoSave() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const pendingRef = useRef<Partial<DocumentData>>({});
  const docIdRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const flushingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (maxTimerRef.current) { clearTimeout(maxTimerRef.current); maxTimerRef.current = null; }
  }, []);

  const doFlush = useCallback(async () => {
    if (flushingRef.current) return;

    const id = docIdRef.current;
    const patch = pendingRef.current;
    pendingRef.current = {};
    dirtyRef.current = false;
    clearTimers();

    if (!id || Object.keys(patch).length === 0) {
      setSaveStatus((s) => (s === "saving" ? "idle" : s));
      return;
    }

    flushingRef.current = true;
    setSaveStatus("saving");

    try {
      await DocumentService.updateDocument(id, patch);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 1200);
    } catch (err) {
      console.error("auto-save failed", err);
      setSaveStatus("error");
      toast.error(friendlyError(err, "Could not save your changes. Check your connection."));
    } finally {
      flushingRef.current = false;
      if (dirtyRef.current) void doFlush();
    }
  }, [clearTimers]);

  useEffect(() => {
    const onBlur = () => {
      if (dirtyRef.current) void doFlush();
    };
    const onBeforeUnload = () => {
      if (!dirtyRef.current) return;
      const id = docIdRef.current;
      const patch = pendingRef.current;
      pendingRef.current = {};
      if (id && Object.keys(patch).length > 0) {
        void DocumentService.updateDocument(id, patch).catch(() => {});
      }
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onBlur();
    });
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearTimers();
      onBeforeUnload();
    };
  }, [doFlush, clearTimers]);

  const triggerSave = useCallback(
    (docId: string, updates: Partial<DocumentData>) => {
      docIdRef.current = docId;

      const clean = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      ) as Partial<DocumentData>;
      pendingRef.current = { ...pendingRef.current, ...clean };
      dirtyRef.current = true;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(doFlush, DEBOUNCE_MS);

      if (!maxTimerRef.current) {
        maxTimerRef.current = setTimeout(doFlush, MAX_WAIT_MS);
      }
    },
    [doFlush]
  );

  return { saveStatus, triggerSave };
}
