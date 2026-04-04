
import React, { useState, useEffect } from 'react';
import AssetList from './components/AssetList';
import QrScanner from './components/QrScanner';
import Auth from './Auth';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, where } from 'firebase/firestore';


function App() {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ name: '', quantity: '', room: '', rack: '' });
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Load assets from Firestore in real time
  useEffect(() => {
    if (!user) {
      setAssets([]);
      return;
    }
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

  return (
    <div>
      <Auth onUserChanged={setUser} />
      {user ? (
        <>
          <h1 style={{textAlign:'center', color:'#1976d2', marginTop:32}}>IT Asset Tracker</h1>
          <div style={summaryStyle}>
            <span><b>Total Devices:</b> {totalDevices}</span>
            <span><b>Devices per Room:</b> {Object.entries(roomCounts).map(([room, count]) => `${room}: ${count}`).join(' | ')}</span>
          </div>
          <div style={{display:'flex', justifyContent:'center', margin:'24px 0', gap: '16px'}}>
            <button style={buttonStyle} onClick={() => setShowModal(true)}>Add Device</button>
            <button style={{...buttonStyle, background:'#43a047'}} onClick={() => setShowQrScanner(true)}>Scan QR Code</button>
          </div>
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
          <AssetList assets={assets} setAssets={setAssets} userEmail={user?.email} />
        </>
      ) : (
        <div style={{textAlign:'center', marginTop:40, color:'#1976d2', fontWeight:500}}>
          Please log in to access the inventory.
        </div>
      )}
    </div>
  );
}

export default App;
