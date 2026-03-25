const AUTH_CODES: Record<string, string> = {
  "auth/email-already-in-use": "That email is already registered. Try logging in instead.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled yet.",
  "auth/weak-password": "Password is too short — use at least 6 characters.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Wrong password. Double-check and try again.",
  "auth/invalid-credential": "Email or password is wrong. Try again.",
  "auth/too-many-requests": "Too many failed attempts. Wait a minute and retry.",
  "auth/popup-closed-by-user": "Sign-in popup was closed before finishing.",
  "auth/cancelled-popup-request": "Another sign-in window is already open.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/unauthorized-domain": "This domain isn't authorized in Firebase yet. Check the console.",
  "auth/network-request-failed": "Network error — check your internet connection.",
  "auth/requires-recent-login": "You need to log in again before doing that.",
};

const FIRESTORE_CODES: Record<string, string> = {
  "permission-denied": "You don't have permission to do that.",
  "not-found": "That document doesn't exist anymore.",
  "unavailable": "Can't reach the database right now. Check your connection.",
  "deadline-exceeded": "Request timed out. Try again.",
  "resource-exhausted": "Too many requests. Slow down a bit.",
  "unauthenticated": "You need to be logged in.",
  "already-exists": "Something with that name already exists.",
  "failed-precondition": "Can't do that right now — the document may have changed.",
  "aborted": "Operation was interrupted. Try again.",
  "cancelled": "Request was cancelled.",
};

function getFirebaseCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const e = error as { code?: string };
  return typeof e.code === "string" ? e.code : "";
}

export function friendlyError(error: unknown, fallback = "Something went wrong. Try again."): string {
  const code = getFirebaseCode(error);

  if (code.startsWith("auth/")) {
    return AUTH_CODES[code] ?? fallback;
  }

  const firestoreKey = code.replace("firestore/", "");
  if (FIRESTORE_CODES[firestoreKey]) {
    return FIRESTORE_CODES[firestoreKey];
  }

  if (error instanceof Error) {
    if (/network|offline|fetch/i.test(error.message)) {
      return "Network issue — check your connection and try again.";
    }
    if (/permission/i.test(error.message)) {
      return "You don't have permission to do that.";
    }
    if (/not.?found/i.test(error.message)) {
      return "That document doesn't exist anymore.";
    }
  }

  return fallback;
}
