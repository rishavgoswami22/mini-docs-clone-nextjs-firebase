import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../db/firebase";
import { doc, setDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

async function upsertUserProfile({
  uid,
  email,
  displayName,
  photoURL,
}: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        email,
        displayName,
        photoURL,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("User profile sync skipped because Firestore is unavailable.", error);
  }
}

function getFriendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: string }).code)
    : "";

  switch (code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before it finished.";
    case "auth/cancelled-popup-request":
      return "Another Google sign-in window is already open.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup.";
    case "auth/unauthorized-domain":
      return "This domain is not allowed in Firebase Authentication yet. Add your site URL in the Firebase console.";
    case "auth/invalid-credential":
      return "The login credentials were rejected. Please try again.";
    default:
      if (error instanceof Error && /offline/i.test(error.message)) {
        return "Google sign-in worked, but Firestore could not be reached. Please check your internet connection and Firestore setup.";
      }

      return error instanceof Error ? error.message : "Authentication failed.";
  }
}

export const AuthService = {
  async signUp(email: string, password: string, name: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });
    await upsertUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: user.photoURL,
    });

    return user;
  },

  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async loginWithGoogle() {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;

      await upsertUserProfile({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      return user;
    } catch (error) {
      throw new Error(getFriendlyAuthError(error));
    }
  },

  async logout() {
    return await signOut(auth);
  }
};
