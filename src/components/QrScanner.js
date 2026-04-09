
import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const QrScanner = () => {
  const [deviceCode, setDeviceCode] = useState('');
  const [asset, setAsset] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);

  // Step 1: Enter 4-digit device code
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!/^[0-9]{4}$/.test(deviceCode)) {
      setMessage('Enter a valid 4-digit code.');
      return;
    }
    try {
      const docRef = doc(db, 'assets', deviceCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAsset({ id: docSnap.id, ...docSnap.data() });
        setStep(2);
      } else {
        setMessage('Asset not found.');
      }
    } catch (err) {
      setMessage('Error fetching asset: ' + err.message);
    }
  };

  // Step 2: Enter quantity
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || isNaN(quantity) || Number(quantity) < 1) {
      setMessage('Enter a valid quantity.');
      return;
    }
    if (Number(quantity) > asset.quantity) {
      setMessage('Not enough stock.');
      return;
    }
    try {
      await updateDoc(doc(db, 'assets', asset.id), {
        quantity: asset.quantity - Number(quantity),
      });
      setMessage('Checkout successful!');
      setStep(3);
    } catch (err) {
      setMessage('Error updating asset: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#f4f6f8', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ color: '#1976d2', textAlign: 'center' }}>Enter Device Code</h2>
      {step === 1 && (
        <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            maxLength={4}
            pattern="[0-9]{4}"
            value={deviceCode}
            onChange={e => setDeviceCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="4-digit device code"
            style={{ padding: 8, borderRadius: 5, border: '1px solid #b0bec5', fontSize: '1rem', textAlign: 'center', letterSpacing: 4 }}
            autoFocus
          />
          <button type="submit" style={{ padding: '9px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Next</button>
        </form>
      )}
      {step === 2 && asset && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><b>Device:</b> {asset.name}</div>
          <div><b>Current Stock:</b> {asset.quantity}</div>
          <input
            type="number"
            min="1"
            max={asset.quantity}
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="Quantity to take"
            style={{ padding: 8, borderRadius: 5, border: '1px solid #b0bec5', fontSize: '1rem' }}
          />
          <button type="submit" style={{ padding: '9px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Checkout</button>
        </form>
      )}
      {step === 3 && (
        <div style={{ color: '#43a047', textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>{message}</div>
      )}
      {message && step !== 3 && (
        <div style={{ color: '#e53935', marginTop: 16, textAlign: 'center' }}>{message}</div>
      )}
    </div>
  );
};

export default QrScanner;
