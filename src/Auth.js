// src/Auth.js
import React, { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

export default function Auth({ onUserChanged }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // or "signup"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (onUserChanged) onUserChanged(u);
    });
    return () => unsubscribe();
  }, [onUserChanged]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Immediately create user doc in Firestore with role 'technician'
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: cred.user.email || '',
        displayName: cred.user.displayName || '',
        role: 'technician',
      }, { merge: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div>Signed in as <b>{user.email}</b></div>
        <button onClick={handleLogout} style={{ marginTop: 8, padding: '6px 16px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 320, margin: '0 auto', marginBottom: 24, padding: 16, background: '#f4f6f8', borderRadius: 8 }}>
      <h3 style={{ textAlign: 'center', color: '#1976d2' }}>{mode === "login" ? "Login" : "Sign Up"}</h3>
      <form onSubmit={mode === "login" ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #b0bec5' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #b0bec5' }} />
        {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}
        <button type="submit" style={{ padding: '8px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>{mode === "login" ? "Login" : "Sign Up"}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        {mode === "login" ? (
          <span>Don't have an account? <button style={{ color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode("signup")}>Sign Up</button></span>
        ) : (
          <span>Already have an account? <button style={{ color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setMode("login")}>Login</button></span>
        )}
      </div>
    </div>
  );
}
