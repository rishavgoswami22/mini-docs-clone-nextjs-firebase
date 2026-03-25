import type { User } from "firebase/auth";
import type { DocumentData } from "@/types";

export function docSharedWithList(doc: DocumentData): string[] {
  return doc.sharedWith ?? [];
}

export function canEditDocument(doc: DocumentData, user: User | null): boolean {
  if (!user) return false;
  if (doc.ownerId === user.uid) return true;
  const mail = user.email?.trim().toLowerCase();
  if (!mail) return false;
  return docSharedWithList(doc).some((e) => e === mail);
}

export function isDocumentOwner(doc: DocumentData, user: User | null): boolean {
  return !!user && doc.ownerId === user.uid;
}
