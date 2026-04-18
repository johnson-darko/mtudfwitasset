import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const ToolMateCheckIn = ({ onSubmit, user }) => {
  const [form, setForm] = useState({ name: '', tool: '', time: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.tool || !form.time) {
      alert('Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'toolCheckouts'), {
        name: form.name,
        tool: form.tool,
        time: form.time,
        note: form.note,
        status: 'pending',
        createdAt: Timestamp.now(),
        uid: user?.uid || null,
      });
      setSuccess(true);
      onSubmit({ ...form, uid: user?.uid || null });
      setForm({ name: '', tool: '', time: '', note: '' });
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      alert('Error saving check-out: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:16, maxWidth:400, margin:'0 auto'}}>
      <h2 style={{color:'#1976d2', textAlign:'center'}}>Tool Check-Out</h2>
      <input
        name="name"
        placeholder="Technician Name"
        value={form.name}
        onChange={handleChange}
        style={{padding:8, borderRadius:5, border:'1px solid #b0bec5', fontSize:'1rem'}}
      />
      <input
        name="tool"
        placeholder="Tool Needed"
        value={form.tool}
        onChange={handleChange}
        style={{padding:8, borderRadius:5, border:'1px solid #b0bec5', fontSize:'1rem'}}
      />
      <input
        name="time"
        type="datetime-local"
        placeholder="Check-Out Time"
        value={form.time}
        onChange={handleChange}
        style={{padding:8, borderRadius:5, border:'1px solid #b0bec5', fontSize:'1rem'}}
      />
      <textarea
        name="note"
        placeholder="Note (optional)"
        value={form.note}
        onChange={handleChange}
        style={{padding:8, borderRadius:5, border:'1px solid #b0bec5', fontSize:'1rem'}}
      />
      <button type="submit" disabled={saving} style={{padding:'9px 18px', background:'#1976d2', color:'#fff', border:'none', borderRadius:'5px', fontWeight:600, fontSize:'1rem', cursor:'pointer', opacity: saving ? 0.7 : 1}}>
        {saving ? 'Saving...' : 'Check Out Tool'}
      </button>
      {success && <div style={{color:'#43a047', textAlign:'center', marginTop:8}}>Check-out saved!</div>}
    </form>
  );
};

export default ToolMateCheckIn;
