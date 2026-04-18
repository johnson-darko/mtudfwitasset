import React, { useRef, useState } from 'react';
import mtuBanner from '../mtu.svg';

function LetterSignaturePage() {
  const [fullName, setFullName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  // Draw signature
  const startDrawing = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(
      (e.touches ? e.touches[0].clientX : e.nativeEvent.offsetX),
      (e.touches ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY)
    );
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(
      (e.touches ? e.touches[0].clientX : e.nativeEvent.offsetX),
      (e.touches ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY)
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    const data = {
      fullName,
      date,
      signature: signatureData,
    };
    localStorage.setItem('letterSignature', JSON.stringify(data));
    setSaved(true);
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: '40px auto',
      padding: 32,
      fontFamily: 'serif',
      background: '#fff'
    }}>
      <div style={{textAlign: 'center', marginBottom: 24}}>
        <img src={mtuBanner} alt="MTU Banner" style={{maxWidth: 320, width: '100%', marginBottom: 16}} />
      </div>
      <div style={{marginBottom: 24}}>
        <label style={{display: 'block', marginBottom: 16}}>
          <b>Name:</b><br/>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={{width: '100%', padding: 8, fontSize: 18, marginTop: 4}}
          />
        </label>
        <label style={{display: 'block', marginBottom: 16}}>
          <b>Date of signature:</b><br/>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{width: '100%', padding: 8, fontSize: 18, marginTop: 4}}
          />
        </label>
      </div>
      <div style={{marginBottom: 32, fontSize: 17, lineHeight: 1.7}}>
        I confirm that I have read, understood, and agree to comply with the terms outlined in the following documents:
        <ol style={{margin: '16px 0 0 24px'}}>
          <li>Building Safety Sign-in Document</li>
        </ol>
      </div>
      <div style={{marginBottom: 24}}>
        <div style={{marginBottom: 8}}><b>Signature:</b></div>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          style={{background: '#fff', touchAction: 'none'}}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div>
          <button onClick={clearSignature} style={{marginTop: 8}}>Clear Signature</button>
        </div>
      </div>
      <button onClick={handleSave} style={{marginTop: 24, width: '100%', padding: 12, fontSize: 18, background: '#2d7dd2', color: '#fff', border: 'none', borderRadius: 4}}>Save</button>
      {saved && <div style={{marginTop: 16, color: 'green'}}>Saved locally!</div>}
    </div>
  );
}

export default LetterSignaturePage;
