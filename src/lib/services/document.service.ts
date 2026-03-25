import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type QuerySnapshot,
  type UpdateData,
} from "firebase/firestore";
import { db } from "../db/firebase";
import { normalize, stripUndefined } from "@/lib/utils/plate-normalize";
import { DocumentData, DocumentRole, PlateContent } from "@/types";

function uniqEmails(emails: string[]) {
  return [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

const EMPTY_DOCUMENT_CONTENT: PlateContent = [
  {
    type: "p",
    children: [{ text: "" }],
  },
] as unknown as PlateContent;

export const DocumentService = {
  async createDocument(userId: string, userEmail: string, title: string = "Untitled Document") {
    const newDocRef = doc(collection(db, "documents"));
    const documentData: DocumentData = {
      id: newDocRef.id,
      title,
      content: normalize(EMPTY_DOCUMENT_CONTENT),
      ownerId: userId,
      ownerEmail: userEmail,
      collaborators: [],
      sharedWith: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await setDoc(newDocRef, documentData);
    return documentData;
  },

  /** Realtime listener for docs you own + docs shared with you. */
  subscribeToUserDocuments(
    userId: string,
    userEmail: string | null,
    callback: (documents: DocumentData[]) => void,
    onError?: (error: Error) => void
  ) {
    const byId = new Map<string, DocumentData>();
    let ownerSnap: QuerySnapshot | null = null;
    let sharedSnap: QuerySnapshot | null = null;
    const emailKey = userEmail?.trim().toLowerCase() ?? "";

    const pushMerged = () => {
      if (!ownerSnap) return;
      byId.clear();
      ownerSnap.docs.forEach((d) => {
        const row = d.data() as DocumentData;
        byId.set(row.id, row);
      });
      if (sharedSnap) {
        sharedSnap.docs.forEach((d) => {
          const row = d.data() as DocumentData;
          byId.set(row.id, row);
        });
      }
      callback([...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt));
    };

    const qOwned = query(collection(db, "documents"), where("ownerId", "==", userId));

    const unsubOwned = onSnapshot(
      qOwned,
      (snap) => {
        ownerSnap = snap;
        pushMerged();
      },
      (err) => onError?.(err as Error)
    );

    let unsubShared = () => {};
    if (emailKey) {
      const qShared = query(
        collection(db, "documents"),
        where("sharedWith", "array-contains", emailKey)
      );
      unsubShared = onSnapshot(
        qShared,
        (snap) => {
          sharedSnap = snap;
          pushMerged();
        },
        (err) => onError?.(err as Error)
      );
    } else {
      sharedSnap = null;
      pushMerged();
    }

    return () => {
      unsubOwned();
      unsubShared();
    };
  },

  async updateDocument(docId: string, updates: Partial<DocumentData>) {
    const docRef = doc(db, "documents", docId);
    const payload: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.title !== undefined) {
      payload.title = updates.title === "" ? "Untitled" : updates.title;
    }
    if (updates.content !== undefined) {
      payload.content = normalize(updates.content);
    }
    if (updates.ownerEmail !== undefined) payload.ownerEmail = updates.ownerEmail;
    if (updates.collaborators !== undefined) {
      payload.collaborators = stripUndefined(updates.collaborators);
    }
    if (updates.sharedWith !== undefined) {
      payload.sharedWith = updates.sharedWith;
    }

    await updateDoc(docRef, stripUndefined(payload) as UpdateData<DocumentData>);
  },

  async deleteDocument(docId: string) {
    await deleteDoc(doc(db, "documents", docId));
  },

  subscribeToDocument(
    docId: string,
    callback: (doc: DocumentData | null) => void,
    onError?: (err: Error) => void
  ) {
    const docRef = doc(db, "documents", docId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as DocumentData);
        } else {
          callback(null);
        }
      },
      (err) => onError?.(err as Error)
    );
  },
  
  async shareDocument(docId: string, email: string, role: DocumentRole) {
    const docRef = doc(db, "documents", docId);
    const documentSnapshot = await getDoc(docRef);
    const docData = documentSnapshot.exists()
      ? (documentSnapshot.data() as DocumentData)
      : null;

    if (!docData) throw new Error("Document not found");

    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) throw new Error("Invalid email");

    const list = [...(docData.collaborators ?? [])];
    const idx = list.findIndex((c) => c.email.toLowerCase() === normalized);

    if (idx >= 0) {
      list[idx] = { email: normalized, role };
    } else {
      list.push({ email: normalized, role });
    }

    const sharedWith = uniqEmails(list.map((c) => c.email));

    await updateDoc(docRef, {
      collaborators: list,
      sharedWith,
      updatedAt: Date.now(),
    });

    return list;
  }
};
