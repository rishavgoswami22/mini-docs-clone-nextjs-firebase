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
import { friendlyError } from "@/lib/utils/error-messages";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

async function upsertUserProfile(profile: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  try {
    await setDoc(doc(db, "users", profile.uid), { ...profile, updatedAt: Date.now() }, { merge: true });
  } catch {
    // profile sync is optional — auth still works without it
  }
}

export const AuthService = {
  async signUp(email: string, password: string, name: string) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await upsertUserProfile({ uid: cred.user.uid, email: cred.user.email, displayName: name, photoURL: cred.user.photoURL });
      return cred.user;
    } catch (err) {
      throw new Error(friendlyError(err, "Could not create account. Try again."));
    }
  },

  async login(email: string, password: string) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user;
    } catch (err) {
      throw new Error(friendlyError(err, "Login failed. Check your email and password."));
    }
  },

  async loginWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await upsertUserProfile({ uid: cred.user.uid, email: cred.user.email, displayName: cred.user.displayName, photoURL: cred.user.photoURL });
      return cred.user;
    } catch (err) {
      throw new Error(friendlyError(err, "Google sign-in failed."));
    }
  },

  async logout() {
    return await signOut(auth);
  },
};
