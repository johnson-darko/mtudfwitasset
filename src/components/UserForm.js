import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { collection, setDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';

const defaultOrg = 'MTU Maintenance Fort Worth';



function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function generateEmail(first, last) {
  // Remove spaces from first and last name(s), capitalize each word, join together
  const firstPart = capitalizeWords(first).replace(/\s+/g, '');
  const lastPart = capitalizeWords(last).replace(/\s+/g, '');
  return `${firstPart}.${lastPart}@mtu.aero`;
}


export default function UserForm({ userEmail }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [users, setUsers] = useState([]); // Array of user objects
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  // Helper to normalize column names (case-insensitive, ignore spaces/underscores)
  function normalizeCol(str) {
    return (str || '').toLowerCase().replace(/\s+|_/g, '');
  }

  // Import handler
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    for (const row of rows) {
      // Case-insensitive column mapping
      const map = {};
      for (const key of Object.keys(row)) {
        map[normalizeCol(key)] = row[key];
      }
      let guid = map['guid'] || uuidv4();
      // Ensure guid is unique in Firestore
      if (users.some(u => u.guid === guid)) continue;
      const type = map['type'] || 0;
      const first = map['firstname'] || '';
      const last = map['lastname'] || '';
      const org = map['organization'] || defaultOrg;
      const email = map['email'] || generateEmail(first, last);
      const userObj = {
        guid,
        type,
        firstName: capitalizeWords(first),
        lastName: capitalizeWords(last),
        organization: org,
        email
      };
      try {
        await setDoc(doc(collection(db, 'guid'), guid), userObj);
      } catch (err) {
        setError('Error saving imported row: ' + err.message);
      }
    }
    // Reset file input
    e.target.value = '';
  };

  // Export handler
  const handleExport = () => {
    const exportCols = [
      { key: 'guid', label: 'guid' },
      { key: 'type', label: 'type' },
      { key: 'firstName', label: 'firstname' },
      { key: 'lastName', label: 'lastname' },
      { key: 'organization', label: 'organization' },
      { key: 'email', label: 'email' },
    ];
    const rows = users.map(u =>
      exportCols.map(col => {
        if (col.key === 'type') return u.type || 0;
        return u[col.key] || '';
      })
    );
    const header = exportCols.map(col => col.label);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'users_export.xlsx');
  };

  // Load users from Firestore on mount and update live (from 'guid' collection)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'guid'), (snapshot) => {
      const loaded = snapshot.docs.map(doc => doc.data());
      setUsers(loaded);
    });
    return () => unsub();
  }, []);

  // Save users to localStorage for Systems page
  useEffect(() => {
    try {
      localStorage.setItem('userFormUsers', JSON.stringify(users));
    } catch {}
  }, [users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let guid;
    // Ensure guid is unique in the table
    do {
      guid = uuidv4();
    } while (users.some(u => u.guid === guid));
    const type = 0;
    const capFirst = capitalizeWords(firstName);
    const capLast = capitalizeWords(lastName);
    const email = generateEmail(firstName, lastName);
    const userObj = { guid, type, firstName: capFirst, lastName: capLast, organization: defaultOrg, email };
    // Do not update users here; Firestore snapshot will update the table
    try {
      await setDoc(doc(collection(db, 'guid'), guid), userObj);
    } catch (err) {
      setError('Error saving to Firestore: ' + err.message);
    }
    setFirstName('');
    setLastName('');
    setError('');
  };

  const [editRow, setEditRow] = useState(null); // guid of row being edited
  const [editData, setEditData] = useState({});
  const isSupervisor = userEmail === 'johnsondarko365@gmail.com';

  // Delete user
  const handleDelete = async (guid) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(collection(db, 'guid'), guid));
      setEditRow(null);
    } catch (err) {
      setError('Error deleting user: ' + err.message);
    }
  };

  // Start editing
  const startEdit = (u) => {
    setEditRow(u.guid);
    setEditData({
      firstName: u.firstName,
      lastName: u.lastName,
      organization: u.organization,
      email: u.email,
      type: u.type
    });
  };

  // Save edit
  const handleEditSave = async (guid) => {
    try {
      await setDoc(doc(collection(db, 'guid'), guid), {
        guid,
        ...editData,
      });
      setEditRow(null);
    } catch (err) {
      setError('Error updating user: ' + err.message);
    }
  };
  // Link IT Asset users (from localStorage) to user table and remove those no longer present
  const linkItAssetUsers = async () => {
    let assetUsers = [];
    try {
      assetUsers = JSON.parse(localStorage.getItem('itAssetUsers')) || [];
    } catch (e) { assetUsers = []; }
    // Build a set of "first|last" for current IT Asset users
    const assetNameSet = new Set(assetUsers.map(au => (capitalizeWords(au.firstName) + '|' + capitalizeWords(au.lastName)).toLowerCase()));
    // Add new users from IT Asset
    const existing = new Set((users || []).map(u => (u.firstName + '|' + u.lastName).toLowerCase()));
    let added = 0;
    for (const au of assetUsers) {
      const key = (capitalizeWords(au.firstName) + '|' + capitalizeWords(au.lastName)).toLowerCase();
      if (!au.firstName || !au.lastName || existing.has(key)) continue;
      const guid = uuidv4();
      const userObj = {
        guid,
        type: 0,
        firstName: capitalizeWords(au.firstName),
        lastName: capitalizeWords(au.lastName),
        organization: defaultOrg,
        email: generateEmail(au.firstName, au.lastName),
        source: 'itAsset',
      };
      try {
        await setDoc(doc(collection(db, 'guid'), guid), userObj);
        added++;
      } catch (err) {
        setError('Error linking IT Asset user: ' + err.message);
      }
    }
    // Remove users with source: 'itAsset' whose names are no longer in IT Asset
    const toRemove = (users || []).filter(u => u.source === 'itAsset' && !assetNameSet.has((u.firstName + '|' + u.lastName).toLowerCase()));
    let removed = 0;
    for (const u of toRemove) {
      try {
        await deleteDoc(doc(collection(db, 'guid'), u.guid));
        removed++;
      } catch (err) {
        setError('Error removing IT Asset user: ' + err.message);
      }
    }
    if (added === 0 && removed === 0) setError('No changes needed.');
    else setError(`${added} IT Asset user(s) linked, ${removed} removed.`);
  };
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#1976d2', letterSpacing: 1 }}>Printer Users</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                <button
                  type="button"
                  style={{ marginLeft: 12, padding: '8px 18px', background: '#ffa000', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
                  onClick={linkItAssetUsers}
                >Link IT Asset Users</button>
        <div>
          <label>First Name(s):<br />
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: 180 }} />
          </label>
        </div>
        <div>
          <label>Last Name:<br />
            <input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: 180 }} />
          </label>
        </div>
        <button type="submit" style={{ padding: '8px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>Add</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button
          type="button"
          style={{ marginLeft: 12, padding: '8px 18px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >Import(.xlsx)</button>
        <button
          type="button"
          style={{ marginLeft: 12, padding: '8px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
          onClick={handleExport}
        >Export(.xlsx)</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <thead style={{ background: '#1976d2', color: '#fff' }}>
            <tr>
              {isSupervisor && <th style={{ padding: 10 }}></th>}
              <th style={{ padding: 10 }}>guid ({users.length})</th>
              <th style={{ padding: 10 }}>type</th>
              <th style={{ padding: 10 }}>firstname</th>
              <th style={{ padding: 10 }}>lastname</th>
              <th style={{ padding: 10 }}>organization</th>
              <th style={{ padding: 10 }}>email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.guid} style={{ background: idx % 2 === 0 ? '#f4f6f8' : '#fff' }}>
                {isSupervisor && (
                  <td style={{ padding: 8, textAlign: 'center', cursor: 'pointer', width: 36, position: 'relative' }}>
                    <span
                      title="Edit/Delete"
                      onClick={() => editRow === u.guid ? setEditRow(null) : startEdit(u)}
                      style={{ fontSize: 18, color: '#1976d2', userSelect: 'none' }}
                    >
                      ✏️
                    </span>
                    {editRow === u.guid && (
                      <div style={{ position: 'absolute', left: '110%', top: 0, background: '#fff', border: '1px solid #1976d2', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', zIndex: 10, padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button
                          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}
                          onClick={() => setEditRow('edit-'+u.guid)}
                        >Edit</button>
                        <button
                          style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}
                          onClick={() => handleDelete(u.guid)}
                        >Delete</button>
                      </div>
                    )}
                  </td>
                )}
                {/* Inline edit row */}
                {editRow === 'edit-'+u.guid ? (
                  <>
                    <td style={{ padding: 8, fontFamily: 'monospace' }}>{u.guid}</td>
                    <td style={{ padding: 8 }}>
                      <input value={editData.type} onChange={e => setEditData(d => ({...d, type: e.target.value}))} style={{ width: 40 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input value={editData.firstName} onChange={e => setEditData(d => ({...d, firstName: e.target.value}))} style={{ width: 90 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input value={editData.lastName} onChange={e => setEditData(d => ({...d, lastName: e.target.value}))} style={{ width: 90 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input value={editData.organization} onChange={e => setEditData(d => ({...d, organization: e.target.value}))} style={{ width: 120 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <input value={editData.email} onChange={e => setEditData(d => ({...d, email: e.target.value}))} style={{ width: 160 }} />
                    </td>
                    <td style={{ padding: 8 }}>
                      <button style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 3, padding: '4px 10px', cursor: 'pointer', fontSize: 14, marginRight: 6 }} onClick={() => handleEditSave(u.guid)}>Save</button>
                      <button style={{ background: '#b0bec5', color: '#333', border: 'none', borderRadius: 3, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }} onClick={() => setEditRow(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: 8, fontFamily: 'monospace' }}>{u.guid}</td>
                    <td style={{ padding: 8 }}>{u.type}</td>
                    <td style={{ padding: 8 }}>{u.firstName}</td>
                    <td style={{ padding: 8 }}>{u.lastName}</td>
                    <td style={{ padding: 8 }}>{u.organization}</td>
                    <td style={{ padding: 8 }}>{u.email}</td>
                  </>
                )}
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={isSupervisor ? 7 : 6} style={{ textAlign: 'center', color: '#888', padding: 16 }}>No users added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
