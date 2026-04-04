
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = () => {
  const [scannedId, setScannedId] = useState('');
  const [asset, setAsset] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [scannerRunning, setScannerRunning] = useState(false);
  const scannerRef = useRef();
  const html5QrCodeRef = useRef();

  useEffect(() => {
    if (step !== 1) return;
    let isMounted = true;
    const startScanner = async () => {
      // Wait for the DOM node to exist
      if (!scannerRef.current) {
        setTimeout(startScanner, 100);
        return;
      }
      const qrRegionId = 'qr-reader';
      html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      try {
        // Always prefer the environment (back) camera on mobile
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (decodedText && step === 1) {
              setScannedId(decodedText);
              setStep(2);
              setScannerRunning(false);
              await html5QrCodeRef.current.stop().catch(() => {});
              // Fetch asset info
              const docRef = doc(db, 'assets', decodedText);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                setAsset({ id: docSnap.id, ...docSnap.data() });
              } else {
                setMessage('Asset not found.');
              }
            }
          },
          (errorMessage) => {
            // Optionally handle scan errors
          }
        );
        setScannerRunning(true);
      } catch (err) {
        setMessage('Camera error: ' + err.message);
      }
    };
    startScanner();
    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        // Always try to stop before clear, and await stop
        const stopAndClear = async () => {
          try {
            await html5QrCodeRef.current.stop();
          } catch (e) {
            // ignore if already stopped
          }
          try {
            await html5QrCodeRef.current.clear();
          } catch (e) {
            // ignore if already cleared
          }
        };
        stopAndClear();
      }
    };
    // eslint-disable-next-line
  }, [step]);

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
      <h2 style={{ color: '#1976d2', textAlign: 'center' }}>Scan Device QR Code</h2>
      {step === 1 && (
        <div id="qr-reader" ref={scannerRef} style={{ width: '100%', minHeight: 280 }} />
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
