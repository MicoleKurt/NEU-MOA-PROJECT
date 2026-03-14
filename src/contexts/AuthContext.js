import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "../firebase/config";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = async () => { await signOut(auth); setUserProfile(null); };

  const fetchProfile = async (uid) => {
    const snap = await getDoc(doc(db, "moa_users", uid));
    return snap.exists() ? snap.data() : null;
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) { const p = await fetchProfile(user.uid); setUserProfile(p); }
      else setUserProfile(null);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, setUserProfile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
