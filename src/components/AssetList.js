
import React, { useState } from 'react';
// import { QRCodeCanvas } from 'qrcode.react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';



const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '20px',
  background: '#fff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  borderRadius: '8px',
  overflow: 'hidden',
  minWidth: 320,
};

const thStyle = {
  background: '#1976d2',
  color: '#fff',
  padding: '14px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '1rem',
  borderBottom: '2px solid #1565c0',
};

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #e0e0e0',
  fontSize: '0.98rem',
};

const trHoverStyle = {
  background: '#f5faff',
};

const containerStyle = {
  maxWidth: '700px',
  margin: '40px auto',
  padding: '32px',
  background: '#f4f6f8',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  boxSizing: 'border-box',
};

// Responsive styles
const responsiveStyle = `
  @media (max-width: 900px) {
    .asset-container { max-width: 98vw; padding: 10px; }
    .asset-table { font-size: 0.95rem; }
    .asset-modal { min-width: 90vw !important; padding: 18px 6vw !important; }
  }
  @media (max-width: 600px) {
    .asset-container { max-width: 100vw; padding: 2vw; }
    .asset-table, .asset-table th, .asset-table td { font-size: 0.89rem !important; }
    .asset-table th, .asset-table td { padding: 7px 4px !important; }
    .asset-modal { min-width: 98vw !important; padding: 10px 2vw !important; }
    .asset-table thead { display: none; }
    .asset-table tr { display: block; margin-bottom: 16px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .asset-table td { display: flex; justify-content: space-between; align-items: center; border: none; border-bottom: 1px solid #f0f0f0; position: relative; padding: 10px 8px !important; }
    .asset-table td:before { content: attr(data-label); font-weight: 600; color: #1976d2; margin-right: 8px; }
    .asset-table td:last-child { border-bottom: none; }
  }
`;

const titleStyle = {
  color: '#1976d2',
  fontWeight: 700,
  fontSize: '2rem',
  marginBottom: '18px',
  letterSpacing: '1px',
  textAlign: 'center',
};

const searchBarStyle = {
  width: '100%',
  padding: '10px 14px',
  marginBottom: '18px',
  borderRadius: '6px',
  border: '1px solid #b0bec5',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const sortArrow = (active, direction) => active ? (direction === 'asc' ? ' ▲' : ' ▼') : '';

const getStockColor = (qty) => {
  if (qty <= 5) return '#e53935'; // red
  if (qty <= 10) return '#ffb300'; // orange
  return '#43a047'; // green
};

const badgeStyle = (qty) => ({
  display: 'inline-block',
  minWidth: 28,
  padding: '2px 10px',
  borderRadius: '12px',
  background: getStockColor(qty),
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.98rem',
  textAlign: 'center',
  marginLeft: 6,
});

const ADMIN_EMAIL = "johnsondarko365@gmail.com";
const AssetList = ({ assets, setAssets, userEmail }) => {
  // ...existing code...
  // Add asset creation logic using 4-digit code as document ID
  const [newAsset, setNewAsset] = useState({ name: '', quantity: '', room: '', rack: '' });
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddChange = e => {
    setNewAsset({ ...newAsset, [e.target.name]: e.target.value });
  };

  // Helper to generate a unique 4-digit code
  const generateUniqueCode = async () => {
    let code;
    let exists = true;
    while (exists) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      const docRef = doc(db, 'assets', code);
      const docSnap = await getDoc(docRef);
      exists = docSnap.exists();
    }
    return code;
  };

  const handleAddSubmit = async e => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.quantity || !newAsset.room || !newAsset.rack) {
      alert('Fill all fields.');
      return;
    }
    try {
      const code = await generateUniqueCode();
      await setDoc(doc(db, 'assets', code), {
        name: newAsset.name,
        quantity: Number(newAsset.quantity),
        room: newAsset.room,
        rack: newAsset.rack,
        code
      });
      setShowAddModal(false);
      setNewAsset({ name: '', quantity: '', room: '', rack: '' });
    } catch (err) {
      alert('Error adding asset: ' + err.message);
    }
  };
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', quantity: '', room: '', rack: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const openEditModal = (idx) => {
    setEditIdx(idx);
    const asset = sortedAssets[idx];
    setEditForm({
      name: asset.name,
      quantity: asset.quantity,
      room: asset.room,
      rack: asset.rack,
    });
    setShowEditModal(true);
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };


  const handleEditSubmit = async e => {
    e.preventDefault();
    if (!editForm.name || !editForm.quantity || !editForm.room || !editForm.rack) return;
    const asset = sortedAssets[editIdx];
    try {
      await updateDoc(doc(db, 'assets', asset.id), {
        name: editForm.name,
        quantity: Number(editForm.quantity),
        room: editForm.room,
        rack: editForm.rack,
      });
      setShowEditModal(false);
    } catch (err) {
      alert('Error updating asset: ' + err.message);
    }
  };


  const handleDelete = async idx => {
    const asset = sortedAssets[idx];
    if (!window.confirm('Delete this asset?')) return;
    try {
      await deleteDoc(doc(db, 'assets', asset.id));
    } catch (err) {
      alert('Error deleting asset: ' + err.message);
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const filteredAssets = assets.filter(asset => {
    const q = search.toLowerCase();
    return (
      asset.name.toLowerCase().includes(q) ||
      asset.room.toLowerCase().includes(q) ||
      asset.rack.toLowerCase().includes(q)
    );
  });

  // Track original index for edit/delete
  const filteredWithIdx = filteredAssets.map((a, i) => ({ ...a, _originalIdx: assets.findIndex(x => x === a) }));
  const sortedAssets = [...filteredWithIdx].sort((a, b) => {
    if (!sortBy) return 0;
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

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

  return (
    <div className="asset-container" style={containerStyle}>
      {/* Responsive CSS injected */}
      <style>{responsiveStyle}</style>
      <h2 style={titleStyle}>Inventory Assets</h2>
      <input
        style={searchBarStyle}
        type="text"
        placeholder="Search by name, room, or rack..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <button style={{marginBottom:16, background:'#1976d2', color:'#fff', border:'none', borderRadius:5, padding:'8px 18px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}} onClick={() => setShowAddModal(true)}>Add Asset</button>
      <table className="asset-table" style={tableStyle}>
              {showAddModal && (
                <div style={modalOverlay}>
                  <div className="asset-modal" style={modalContent}>
                    <button style={closeBtn} onClick={() => setShowAddModal(false)} title="Close">×</button>
                    <h2 style={{color:'#1976d2', textAlign:'center', marginBottom:8}}>Add Asset</h2>
                    <form style={{display:'flex', flexDirection:'column', gap:'12px'}} onSubmit={handleAddSubmit}>
                      <input
                        style={searchBarStyle}
                        name="name"
                        placeholder="Asset Name"
                        value={newAsset.name}
                        onChange={handleAddChange}
                      />
                      <input
                        style={searchBarStyle}
                        name="quantity"
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        value={newAsset.quantity}
                        onChange={handleAddChange}
                      />
                      <input
                        style={searchBarStyle}
                        name="room"
                        placeholder="Room"
                        value={newAsset.room}
                        onChange={handleAddChange}
                      />
                      <input
                        style={searchBarStyle}
                        name="rack"
                        placeholder="Rack"
                        value={newAsset.rack}
                        onChange={handleAddChange}
                      />
                      {/* Device code is now generated automatically */}
                      <div style={{color:'#1976d2', fontWeight:500, fontSize:'0.98rem', marginBottom:4}}>
                        Device code will be generated automatically
                      </div>
                      <button style={{padding:'9px 18px', background:'#1976d2', color:'#fff', border:'none', borderRadius:'5px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}} type="submit">Add Asset</button>
                    </form>
                  </div>
                </div>
              )}
        <thead>
          <tr>
            {/* <th style={thStyle}>ID</th> */}
            <th onClick={() => handleSort('name')} style={{...thStyle, cursor:'pointer'}}>
              Name{sortArrow(sortBy==='name', sortDir)}
            </th>
            <th onClick={() => handleSort('quantity')} style={{...thStyle, cursor:'pointer', position:'relative'}}>
              Quantity{sortArrow(sortBy==='quantity', sortDir)}
              <span
                title="Help: Stock indicators"
                onClick={e => { e.stopPropagation(); setShowHelpModal(true); }}
                style={{
                  display: 'inline-block',
                  marginLeft: 8,
                  cursor: 'pointer',
                  color: '#1976d2',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  border: '1.5px solid #1976d2',
                  width: 18,
                  height: 18,
                  textAlign: 'center',
                  lineHeight: '16px',
                  fontSize: 13,
                  background: '#f8f9fa',
                  verticalAlign: 'middle',
                  userSelect: 'none'
                }}
                aria-label="Help"
              >
                ?
              </span>
            </th>
            <th onClick={() => handleSort('room')} style={{...thStyle, cursor:'pointer'}}>
              Room{sortArrow(sortBy==='room', sortDir)}
            </th>
            <th onClick={() => handleSort('rack')} style={{...thStyle, cursor:'pointer'}}>
              Rack{sortArrow(sortBy==='rack', sortDir)}
            </th>
            <th style={thStyle}>Device Code</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedAssets.map((asset, idx) => (
            <tr key={asset.id || asset.name + asset.room + asset.rack} style={idx % 2 === 0 ? {} : trHoverStyle}>
              {/* <td style={tdStyle}>{asset.id}</td> */}
              <td style={tdStyle} data-label="Name">{asset.name}</td>
              <td style={tdStyle} data-label="Quantity">
                {asset.quantity}
                <span style={badgeStyle(asset.quantity)}>
                  {asset.quantity <= 5 ? 'Low' : asset.quantity <= 10 ? 'Warning' : 'OK'}
                </span>
              </td>
              <td style={tdStyle} data-label="Room">{asset.room}</td>
              <td style={tdStyle} data-label="Rack">{asset.rack}</td>
              <td style={tdStyle} data-label="Device Code">
                <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: 2, color: '#1976d2' }}>{asset.id}</span>
              </td>
              <td style={tdStyle} data-label="Actions">
                <button style={{marginRight:8, background:'#1976d2', color:'#fff', border:'none', borderRadius:4, padding:'4px 10px', cursor:'pointer'}} onClick={() => openEditModal(idx)}>Edit</button>
                <button style={{background:'#e53935', color:'#fff', border:'none', borderRadius:4, padding:'4px 10px', cursor:'pointer'}} onClick={() => handleDelete(idx)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showEditModal && (
        <div style={modalOverlay}>
          <div className="asset-modal" style={modalContent}>
            <button style={closeBtn} onClick={() => setShowEditModal(false)} title="Close">×</button>
            <h2 style={{color:'#1976d2', textAlign:'center', marginBottom:8}}>Edit Device</h2>
            <form style={{display:'flex', flexDirection:'column', gap:'12px'}} onSubmit={handleEditSubmit}>
              <input
                style={searchBarStyle}
                name="name"
                placeholder="Device Name"
                value={editForm.name}
                onChange={handleEditChange}
              />
              <input
                style={searchBarStyle}
                name="quantity"
                type="number"
                min="1"
                placeholder="Quantity"
                value={editForm.quantity}
                onChange={handleEditChange}
              />
              <input
                style={searchBarStyle}
                name="room"
                placeholder="Room"
                value={editForm.room}
                onChange={handleEditChange}
              />
              <input
                style={searchBarStyle}
                name="rack"
                placeholder="Rack"
                value={editForm.rack}
                onChange={handleEditChange}
              />
              <button style={{padding:'9px 18px', background:'#1976d2', color:'#fff', border:'none', borderRadius:'5px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}} type="submit">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '28px 24px',
            minWidth: '320px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            position: 'relative',
            maxWidth: '90vw',
          }}>
            <button style={{
              position: 'absolute',
              top: 10,
              right: 16,
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              color: '#1976d2',
              cursor: 'pointer',
            }} onClick={() => setShowHelpModal(false)} title="Close">×</button>
            <h3 style={{color:'#1976d2', marginBottom:16}}>Stock Indicators Help</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 12, display:'flex', alignItems:'center' }}>
                <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', background:'#43a047', marginRight:10, border:'1.5px solid #388e3c' }}></span>
                <b>Green</b>: Sufficient stock (more than 10)
              </li>
              <li style={{ marginBottom: 12, display:'flex', alignItems:'center' }}>
                <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', background:'#ffb300', marginRight:10, border:'1.5px solid #ffa000' }}></span>
                <b>Yellow</b>: Low stock (6–10)
              </li>
              <li style={{ display:'flex', alignItems:'center' }}>
                <span style={{ display:'inline-block', width:18, height:18, borderRadius:'50%', background:'#e53935', marginRight:10, border:'1.5px solid #b71c1c' }}></span>
                <b>Red</b>: Critical/Out of stock (5 or less)
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
