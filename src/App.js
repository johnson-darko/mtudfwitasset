
import React, { useState, useEffect, Suspense } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AssetList from './components/AssetList';
import QrScanner from './components/QrScanner';
import Auth from './Auth';
import ToolMate from './pages/ToolMate';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';
const LetterSignature = React.lazy(() => import('./LetterSignature'));


const SUPERVISOR_EMAILS = ['johnsondarko365@gmail.com'];
function AssetApp() {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ name: '', quantity: '', room: '', rack: '' });
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [showQrScanner, setShowQrScanner] = useState(false);
  // Instantly determine role by email
  const userRole = user && SUPERVISOR_EMAILS.includes(user.email) ? 'supervisor' : 'technician';

  // Load assets from Firestore in real time
  // Wait for Firebase Auth state to be ready
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAssets([]);
      return;
    }
    // Ensure user doc exists in users collection
    import('firebase/firestore').then(async ({ doc, setDoc, getDoc }) => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists() || !snap.data().role) {
        await setDoc(userRef, {
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'technician',
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          email: user.email || '',
          displayName: user.displayName || '',
        }, { merge: true });
      }
    });
  }, [user]);

  // Always load assets when user is logged in
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'assets'), orderBy('name'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.room || !form.rack) return;
    // Check for duplicate name (case-insensitive)
    try {
      const q = query(collection(db, 'assets'), where('name', '==', form.name));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        alert('A device with this name already exists.');
        return;
      }
      await addDoc(collection(db, 'assets'), {
        name: form.name,
        quantity: Number(form.quantity),
        room: form.room,
        rack: form.rack,
      });
      setForm({ name: '', quantity: '', room: '', rack: '' });
      setShowModal(false);
    } catch (err) {
      alert('Error adding asset: ' + err.message);
    }
  };

  const formStyle = {
    display: 'flex',
    gap: '12px',
    margin: '24px auto 0',
    maxWidth: '700px',
    padding: '16px',
    background: '#e3eafc',
    borderRadius: '8px',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };
  const inputStyle = {
    padding: '8px 10px',
    borderRadius: '5px',
    border: '1px solid #b0bec5',
    fontSize: '1rem',
    flex: 1,
  };
  const buttonStyle = {
    padding: '9px 18px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
  };

  // Modal styles
  const modalOverlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };
  const modalContent = {
    background: '#fff',
    borderRadius: '10px',
    padding: '32px 28px',
    minWidth: '340px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
  };
  const closeBtn = {
    position: 'absolute',
    top: 10,
    right: 16,
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#1976d2',
    cursor: 'pointer',
  };

  // Summary stats
  const totalDevices = assets.length;
  const roomCounts = assets.reduce((acc, asset) => {
    acc[asset.room] = (acc[asset.room] || 0) + 1;
    return acc;
  }, {});
  const summaryStyle = {
    maxWidth: '700px',
    margin: '0 auto 18px',
    background: '#e3eafc',
    borderRadius: '8px',
    padding: '16px 24px',
    fontSize: '1.08rem',
    color: '#1976d2',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  if (user === undefined) {
    // Show spinner while loading auth state
    return (
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>
        <div style={{border:'6px solid #e3eafc',borderTop:'6px solid #1976d2',borderRadius:'50%',width:48,height:48,animation:'spin 1s linear infinite'}} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <div>
        <nav style={{display:'flex', justifyContent:'center', gap:24, margin:'24px 0'}}>
          <Link to="/mtudfwitasset" style={{color:'#1976d2', fontWeight:600, fontSize:'1.1rem', textDecoration:'none'}}>IT Asset Tracker</Link>
          {/* <Link to="/toolmate" style={{color:'#1976d2', fontWeight:600, fontSize:'1.1rem', textDecoration:'none'}}>ToolMate</Link> */}
          {/* <Link to="/letter-signature" style={{color:'#1976d2', fontWeight:600, fontSize:'1.1rem', textDecoration:'none'}}>Letter Signature</Link> */}
        </nav>
        <Routes>
          <Route path="/" element={
            <div>
              <Auth onUserChanged={setUser} />
              {user ? (
                <>
                  {/* IT Asset Tracker heading removed as requested */}
                  {/* Summary stats and search bar removed as requested */}
                  {/* Old Enter Code button removed; only AssetList button remains */}
                  {showModal && (
                    <div style={modalOverlay}>
                      <div style={modalContent}>
                        <button style={closeBtn} onClick={() => setShowModal(false)} title="Close">×</button>
                        <h2 style={{color:'#1976d2', textAlign:'center', marginBottom:8}}>Add New Device</h2>
                        <form style={{display:'flex', flexDirection:'column', gap:'12px'}} onSubmit={handleSubmit}>
                          <input
                            style={inputStyle}
                            name="name"
                            placeholder="Device Name"
                            value={form.name}
                            onChange={handleChange}
                          />
                          <input
                            style={inputStyle}
                            name="quantity"
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={form.quantity}
                            onChange={handleChange}
                          />
                          <input
                            style={inputStyle}
                            name="room"
                            placeholder="Room"
                            value={form.room}
                            onChange={handleChange}
                          />
                          <input
                            style={inputStyle}
                            name="rack"
                            placeholder="Rack"
                            value={form.rack}
                            onChange={handleChange}
                          />
                          <button style={buttonStyle} type="submit">Add Device</button>
                        </form>
                      </div>
                    </div>
                  )}
                  {showQrScanner && (
                    <div style={modalOverlay}>
                      <div style={{...modalContent, minWidth: 'unset', padding: 0}}>
                        <button style={closeBtn} onClick={() => setShowQrScanner(false)} title="Close">×</button>
                        <QrScanner />
                      </div>
                    </div>
                  )}
                  <AssetList assets={assets} setAssets={setAssets} userEmail={user?.email} onEnterCode={() => setShowQrScanner(true)} />
                </>
              ) : (
                <div style={{textAlign:'center', marginTop:40, color:'#1976d2', fontWeight:500}}>
                  Please log in to access the inventory.
                </div>
              )}
            </div>
          } />
          {/* Protect /mtudfwitasset: show login if not logged in, else show AssetList with signed-in info */}
          <Route path="/mtudfwitasset" element={
            user ? (
              <div>
                {/* Signed in as and Logout button (copied from Auth.js) */}
                <div style={{ marginBottom: 24 }}>
                  <div>Signed in as <b>{user.email}</b></div>
                  <button
                    onClick={async () => {
                      const { getAuth, signOut } = await import('firebase/auth');
                      const { app } = await import('./firebase');
                      await signOut(getAuth(app));
                    }}
                    style={{ marginTop: 8, padding: '6px 16px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >Logout</button>
                </div>
                <AssetList assets={assets} setAssets={setAssets} userEmail={user?.email} onEnterCode={() => setShowQrScanner(true)} />
              </div>
            ) : (
              <div style={{ maxWidth: 320, margin: '0 auto', marginBottom: 24, padding: 16, background: '#f4f6f8', borderRadius: 8 }}>
                <Auth onUserChanged={setUser} />
              </div>
            )
          } />
          <Route path="/toolmate" element={<ToolMate user={user} userRole={userRole} />} />
          <Route path="/letter-signature" element={
            <Suspense fallback={<div>Loading...</div>}>
              <LetterSignature />
            </Suspense>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default AssetApp;
