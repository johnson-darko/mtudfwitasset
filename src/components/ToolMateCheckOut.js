import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const ToolMateCheckOut = ({ entry, onCheckedIn }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!name) {
      alert('Please enter your name to check in the tool.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'toolCheckouts', entry.id), {
        status: 'checked-in',
        checkInName: name,
        checkInNote: note,
        checkInTime: Timestamp.now(),
      });
      setCheckedIn(true);
      onCheckedIn(entry.id);
    } catch (err) {
      alert('Error checking in: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleCheckIn} style={{marginTop:8, background:'#f9fbe7', borderRadius:8, padding:12}}>
      <div style={{marginBottom:8, color:'#1976d2'}}><b>Check In Tool</b></div>
      <input
        placeholder="Your Name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{padding:8, borderRadius:5, border:'1px solid #b0bec5', fontSize:'1rem', marginBottom:8, width:'100%'}}
        disabled={checkedIn}
      />
      <textarea
        placeholder="Note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        style={{padding:8, borderRadius:5, border:'1px solid #b0bec5', fontSize:'1rem', marginBottom:8, width:'100%'}}
        disabled={checkedIn}
      />
      <button type="submit" disabled={saving || checkedIn} style={{padding:'7px 16px', background:'#43a047', color:'#fff', border:'none', borderRadius:'5px', fontWeight:600, fontSize:'1rem', cursor:'pointer', opacity: saving || checkedIn ? 0.7 : 1}}>
        {saving ? 'Saving...' : checkedIn ? 'Checked In!' : 'Check In'}
      </button>
      {checkedIn && <div style={{color:'#43a047', marginTop:8, textAlign:'center'}}>Tool checked in successfully!</div>}
    </form>
  );
};

export default ToolMateCheckOut;
