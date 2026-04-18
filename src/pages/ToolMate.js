import './ToolMate.css';
import React, { useState, useEffect } from 'react';
import ToolMateCheckIn from '../components/ToolMateCheckIn';
import ToolMateCheckOut from '../components/ToolMateCheckOut';
import SupervisorCheckInPanel from '../components/SupervisorCheckInPanel';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';

const ToolMate = ({ user, userRole }) => {
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [recent, setRecent] = useState([]);
  const [optimisticEntries, setOptimisticEntries] = useState([]);
  const isSupervisor = userRole === 'supervisor';
  const [showCheckInPanel, setShowCheckInPanel] = useState(false);
  const [allCheckedOut, setAllCheckedOut] = useState([]);
  // Add state for supervisor check-out form
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);


  // Fetch all checked-out entries for supervisor check-in panel
  useEffect(() => {
    if (!isSupervisor) return;
    const q = query(collection(db, 'toolCheckouts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const checkedOut = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(entry => entry.status === 'checked-out');
      setAllCheckedOut(checkedOut);
    });
    return () => unsub();
  }, [isSupervisor]);

  // Check if user is supervisor (role field in users collection)

  useEffect(() => {
    const q = query(collection(db, 'toolCheckouts'), orderBy('createdAt', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      let entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // If not supervisor, filter to only show own requests
      if (!isSupervisor && user) {
        entries = entries.filter(entry => entry.uid === user.uid);
        // Remove optimistic entries that now exist in Firestore (by matching time/tool/name/uid)
        setOptimisticEntries(prev => prev.filter(opt =>
          !entries.some(e =>
            e.tool === opt.tool &&
            e.time === opt.time &&
            e.name === opt.name &&
            e.uid === opt.uid
          )
        ));
        // Merge optimistic entries (not yet in Firestore) with Firestore entries
        entries = [...optimisticEntries.filter(opt =>
          !entries.some(e =>
            e.tool === opt.tool &&
            e.time === opt.time &&
            e.name === opt.name &&
            e.uid === opt.uid
          )
        ), ...entries].slice(0, 10);
      }
      setRecent(entries);
    });
    return () => unsub();
  }, [isSupervisor, user]);

  // When a check-out is submitted, optimistically add it to recent for technicians
  const handleCheckInSubmit = (form) => {
    setLastCheckIn(form);
    if (!isSupervisor && user) {
      setOptimisticEntries(prev => [
        {
          id: 'local-' + Date.now(),
          name: form.name,
          tool: form.tool,
          time: form.time,
          note: form.note,
          status: 'pending',
          uid: user.uid
        },
        ...prev
      ].slice(0, 10));
    }
  };

  // Export all toolCheckouts as CSV (supervisor only)
  const handleExportCSV = async () => {
    const allDocs = await getDocs(collection(db, 'toolCheckouts'));
    const rows = allDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (rows.length === 0) {
      alert('No data to export.');
      return;
    }
    // CSV header
    const header = [
      'ID',
      'Technician Name',
      'Tool',
      'Checked-Out Time',
      'Checked-Out Note',
      'Status',
      'Approved by',
      'Rejected by',
      'Check-In Name',
      'Check-In Note',
      'Check-In Time',
      'Technician UID',
      'Created At'
    ];
    const csvRows = [header.join(',')];
    rows.forEach(row => {
      csvRows.push([
        row.id,
        '"' + (row.name || '') + '"',
        '"' + (row.tool || '') + '"',
        '"' + (row.time || '') + '"', // Checked-Out Time
        '"' + (row.note || '') + '"', // Checked-Out Note
        row.status || '',
        '"' + (row.approvedBy || '') + '"',
        '"' + (row.rejectedBy || '') + '"',
        '"' + (row.checkInName || '') + '"',
        '"' + (row.checkInNote || '') + '"',
        row.checkInTime && row.checkInTime.toDate ? row.checkInTime.toDate().toLocaleString() : '',
        row.uid || '', // Technician UID
        row.createdAt && row.createdAt.toDate ? row.createdAt.toDate().toLocaleString() : ''
      ].join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toolmate_checkouts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="toolmate-root">
      <h1 className="toolmate-title">ToolMate</h1>
      {isSupervisor && (
        <div className="supervisor-actions">
          <button onClick={handleExportCSV} className="supervisor-btn export-btn">
            Export CSV
          </button>
          <button onClick={() => setShowCheckInPanel(v => !v)} className="supervisor-btn checkin-btn">
            {showCheckInPanel ? 'Hide Check In' : 'Check In'}
          </button>
        </div>
      )}
      {isSupervisor && showCheckInPanel && (
        <SupervisorCheckInPanel checkOuts={allCheckedOut} />
      )}
      {/* Supervisors see a button to show Tool Check-Out form, technicians see it always */}
      {isSupervisor ? (
        <>
          <button
            className="supervisor-btn export-btn"
            style={{marginBottom: 16, width: '100%'}}
            onClick={() => setShowCheckOutForm(v => !v)}
          >
            {showCheckOutForm ? 'Hide Tool Check-Out Form' : 'Show Tool Check-Out Form'}
          </button>
          {showCheckOutForm && <ToolMateCheckIn onSubmit={handleCheckInSubmit} user={user} />}
        </>
      ) : (
        <ToolMateCheckIn onSubmit={handleCheckInSubmit} user={user} />
      )}
      {/* Removed Last Check-Out box for cleaner UI, only show Recent Tool Check-Outs */}

      <h3 className="recent-title">Recent Tool Check-Outs (10 Most)</h3>
      <div className="recent-list">
        {recent.length === 0 && <div className="no-checkouts">No check-outs yet.</div>}
        {recent.map(entry => (
          <div key={entry.id} className={`recent-entry${entry.status === 'pending' ? ' pending' : ''}`}>
            <b>{entry.tool}</b> checked out by <b>{entry.name}</b><br/>
            <span className="entry-time">Time: {entry.time}</span><br/>
            {entry.note && <span className="entry-note">Note: {entry.note}</span>}<br/>
            {entry.status === 'pending' && (
              <>
                <span className="pending-label">Pending approval…</span>
                {isSupervisor && (
                  <div className="supervisor-approve-actions">
                    <button
                      className="supervisor-btn approve-btn"
                      onClick={async () => {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'toolCheckouts', entry.id), { status: 'checked-out', approvedBy: user.displayName || user.email || user.uid });
                      }}
                    >Approve</button>
                    <button
                      style={{padding:'6px 14px', background:'#e53935', color:'#fff', border:'none', borderRadius:5, fontWeight:600, cursor:'pointer'}}
                      onClick={async () => {
                        const { doc, updateDoc } = await import('firebase/firestore');
                        await updateDoc(doc(db, 'toolCheckouts', entry.id), { status: 'rejected', rejectedBy: user.displayName || user.email || user.uid });
                      }}
                    >Reject</button>
                  </div>
                )}
              </>
            )}
            {entry.status === 'checked-out' && (
              <>
                <span style={{color:'#1976d2', fontWeight:600}}>Checked out (approved)</span>
                {isSupervisor && (
                  <ToolMateCheckOut entry={entry} onCheckedIn={() => {}} />
                )}
              </>
            )}
            {entry.status === 'checked-in' && (
              <span style={{color:'#43a047', fontWeight:600}}>Checked in by {entry.checkInName || '—'} at {entry.checkInTime && entry.checkInTime.toDate ? entry.checkInTime.toDate().toLocaleString() : ''}</span>
            )}
            {entry.status === 'rejected' && (
              <span style={{color:'#e53935', fontWeight:600}}>Request rejected</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolMate;
