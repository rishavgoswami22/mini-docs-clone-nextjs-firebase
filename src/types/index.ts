import type { Descendant } from "slate";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type DocumentRole = "owner" | "editor" | "viewer";

export interface Collaborator {
  email: string;
  role: DocumentRole;
}

export type PlateContent = Descendant[];

export interface DocumentData {
  id: string;
  title: string;
  content: PlateContent;
  ownerId: string;
  ownerEmail: string;
  collaborators: Collaborator[];
  /** Lowercase emails, kept in sync with `collaborators` for Firestore queries. */
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";
