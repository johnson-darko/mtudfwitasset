// Extract first and last name from fullName according to custom rules
// Capitalize each word: first letter uppercase, rest lowercase
function capitalizeWords(str) {
  return (str || '').replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function extractFirstAndLastName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  const trimmed = fullName.trim();
  if (trimmed.includes(',')) {
    // e.g. "Johannsen, Alexander" or "MONTANEZ SANTOS, Hugo"
    const [last, ...firstParts] = trimmed.split(',');
    return {
      lastName: capitalizeWords(last.trim()),
      firstName: capitalizeWords(firstParts.join(',').trim()),
    };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    // e.g. "Wesley Nortman" => last: Wesley, first: Nortman
    return {
      lastName: capitalizeWords(parts[0]),
      firstName: capitalizeWords(parts[1]),
    };
  }
  if (parts.length > 2) {
    // e.g. "DARKO Johnson Kwabena" => last: DARKO, first: Johnson Kwabena
    return {
      lastName: capitalizeWords(parts[0]),
      firstName: capitalizeWords(parts.slice(1).join(' ')),
    };
  }
  // fallback: treat all as last name
  return { lastName: capitalizeWords(trimmed), firstName: '' };
}
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
  fontSize: '0.98rem',
  borderBottom: '2px solid #1565c0',
};


const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #e0e0e0',
  fontSize: '0.96rem',
};

const trHoverStyle = {
  background: '#f5faff',
};

const containerStyle = {
  width: '100vw',
  margin: 0,
  padding: '16px 0',
  background: '#f4f6f8',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  boxSizing: 'border-box',
  minHeight: '100vh',
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
  fontSize: '0.96rem',
  textAlign: 'center',
  marginLeft: 6,
});

const ADMIN_EMAIL = "johnsondarko365@gmail.com";
const AssetList = ({ assets, setAssets, userEmail, onEnterCode }) => {
      // Store IT Asset users with valid first and last names in localStorage whenever assets change
      React.useEffect(() => {
        if (Array.isArray(assets)) {
          const assetUsers = assets
            .map(asset => {
              const { firstName, lastName } = extractFirstAndLastName(asset.fullName);
              return {
                firstName,
                lastName,
                fullName: asset.fullName,
                ykdNumber: asset.ykdNumber,
                id: asset.id || asset.name || '',
              };
            })
            .filter(u => u.firstName && u.lastName); // Only those with both names
          try {
            localStorage.setItem('itAssetUsers', JSON.stringify(assetUsers));
          } catch (e) {
            // Ignore storage errors
          }
        }
      }, [assets]);
    // Status filter for search bar
    const [statusFilter, setStatusFilter] = useState('');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  // State for showing actions (edit/delete) per row
  const [showActionsIdx, setShowActionsIdx] = useState(null);
  // Add asset creation logic using 4-digit code as document ID
  const [newAsset, setNewAsset] = useState({
    name: '',
    mtuAssetTag: '',
    dellAssetTag: '',
    serviceTag: '',
    status: 'In Stock',
    fullName: '',
    ykdNumber: '',
    note: ''
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Auto-generate Laptop Name when add modal opens and Dell Asset Tag is empty
  React.useEffect(() => {
    if (showAddModal && !newAsset.dellAssetTag) {
      const pcPrefix = 'QDFWCLPC';
      let maxNum = 0;
      assets.forEach(asset => {
        const match = asset.name && asset.name.match(/^QDFWCLPC(\d{4})$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      if (maxNum < 9999) {
        const nextNum = (maxNum + 1).toString().padStart(4, '0');
        if (newAsset.name !== `${pcPrefix}${nextNum}`) {
          setNewAsset(prev => ({ ...prev, name: `${pcPrefix}${nextNum}` }));
        }
      } else {
        setNewAsset(prev => ({ ...prev, name: '' }));
      }
    }
  }, [showAddModal, newAsset.dellAssetTag, assets]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Find users with more than one laptop (by YKD)
  const usersWithMultiple = (() => {
    const userMap = {};
    assets.forEach(asset => {
      if (asset.ykdNumber) {
        const ykd = asset.ykdNumber.toString();
        if (!userMap[ykd]) userMap[ykd] = [];
        userMap[ykd].push(asset);
      }
    });
    return Object.entries(userMap).filter(([ykd, list]) => list.length > 1);
  })();

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
    if (!newAsset.name || !newAsset.mtuAssetTag || !newAsset.serviceTag) {
      alert('Fill all required fields.');
      return;
    }
    // Prevent duplicate Service Tag assignment
    const serviceTag = newAsset.serviceTag.trim();
    const ykdNumber = newAsset.ykdNumber ? newAsset.ykdNumber.toString().trim() : '';
    // Check if Service Tag is already assigned to a different laptop or YKD
    const conflictingAsset = assets.find(asset => {
      if (!asset.serviceTag) return false;
      const sameServiceTag = asset.serviceTag.trim().toLowerCase() === serviceTag.toLowerCase();
      // If same service tag, but different laptop name or different YKD
      const differentName = asset.name.trim().toLowerCase() !== newAsset.name.trim().toLowerCase();
      const differentYKD = ykdNumber && asset.ykdNumber && asset.ykdNumber.toString().trim() !== ykdNumber;
      return sameServiceTag && (differentName || differentYKD);
    });
    if (conflictingAsset) {
      const conflictName = conflictingAsset.name || '(no name)';
      const conflictYKD = conflictingAsset.ykdNumber ? `YKD${conflictingAsset.ykdNumber}` : '(no YKD)';
      alert(`This Service Tag is already assigned to:\nLaptop: ${conflictName}\nYKD: ${conflictYKD}\nPlease check your entry.`);
      return;
    }
    // Dell Asset Tag logic
    if (!newAsset.dellAssetTag) {
      const confirmNoDell = window.confirm('You did not enter a Dell Asset Tag. Please check the back of the laptop to confirm it really does not have a Dell Asset Tag.\n\nIf you confirm it does NOT have one, click OK to proceed. If you find a Dell Asset Tag, click Cancel, close this alert, and enter the tag.');
      if (!confirmNoDell) {
        alert('Please close this alert and enter the Dell Asset Tag.');
        return;
      }
    }
    // Assignment check: see if user is already assigned a laptop
    const userYKD = ykdNumber;
    // Only check by YKD number
    const alreadyAssigned = assets.filter(asset => {
      const aYKD = asset.ykdNumber ? asset.ykdNumber.toString().trim() : '';
      return userYKD && aYKD && aYKD === userYKD;
    });
    let dualNote = '';
    if (alreadyAssigned.length > 0) {
      let noteInput = '';
      while (!noteInput) {
        noteInput = window.prompt(
          `This YKD number is already assigned the following laptop(s):\n\n${alreadyAssigned.map(a => `- ${a.name}`).join('\n')}\n\nYou are assigning a new laptop (dual assignment). Please enter a note (eg User needs a new laptop and would return old one.):`
        );
        if (noteInput === null) {
          alert('Assignment cancelled. User already has a laptop.');
          return;
        }
        noteInput = noteInput.trim();
      }
      dualNote = noteInput;
      // Mark all previous laptops as 'old' in their note field
      for (const asset of alreadyAssigned) {
        await updateDoc(doc(db, 'assets', asset.id), { note: 'old' });
      }
    }
    try {
      const code = await generateUniqueCode();
      await setDoc(doc(db, 'assets', code), {
        name: newAsset.name,
        quantity: 1,
        room: 'Room 2',
        rack: '',
        mtuAssetTag: newAsset.mtuAssetTag || '',
        dellAssetTag: newAsset.dellAssetTag || '',
        serviceTag: newAsset.serviceTag || '',
        status: newAsset.status || '',
        fullName: newAsset.fullName || '',
        ykdNumber: newAsset.ykdNumber || '',
        note: alreadyAssigned.length > 0 ? dualNote || 'new' : '',
        code
      });
      setShowAddModal(false);
      setNewAsset({
        name: '',
        mtuAssetTag: '',
        serviceTag: '',
        status: 'In Stock',
        fullName: '',
        ykdNumber: ''
      });
    } catch (err) {
      alert('Error adding asset: ' + err.message);
    }
  };
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    mtuAssetTag: '',
    dellAssetTag: '',
    serviceTag: '',
    status: '',
    fullName: '',
    ykdNumber: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const openEditModal = (idx) => {
    setEditIdx(idx);
    const asset = sortedAssets[idx];
    setEditForm({
      name: asset.name || '',
      mtuAssetTag: asset.mtuAssetTag || '',
      dellAssetTag: asset.dellAssetTag || '',
      serviceTag: asset.serviceTag || '',
      status: asset.status || '',
      fullName: asset.fullName || asset.firstName || '',
      ykdNumber: asset.ykdNumber || ''
    });
    setShowEditModal(true);
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };


  const handleEditSubmit = async e => {
    e.preventDefault();
    if (!editForm.name) return;
    const asset = sortedAssets[editIdx];
    // Only allow YKD assignment if currently blank
    const originalYKD = asset.ykdNumber ? asset.ykdNumber.toString().trim() : '';
    const newYKD = editForm.ykdNumber ? editForm.ykdNumber.toString().trim() : '';
    let dualNote = '';
    // If assigning a new YKD, check for duplicate assignment
    if (!originalYKD && newYKD) {
      const alreadyAssigned = assets.filter(a => {
        const aYKD = a.ykdNumber ? a.ykdNumber.toString().trim() : '';
        return a.id !== asset.id && aYKD && aYKD === newYKD;
      });
      if (alreadyAssigned.length > 0) {
        let noteInput = '';
        while (!noteInput) {
          noteInput = window.prompt(
            `This YKD number is already assigned the following laptop(s):\n\n${alreadyAssigned.map(a => `- ${a.name}`).join('\n')}\n\nYou are assigning a new laptop (dual assignment). Please enter a note (eg User needs a new laptop and would return old one.):`
          );
          if (noteInput === null) {
            alert('Assignment cancelled. User already has a laptop.');
            return;
          }
          noteInput = noteInput.trim();
        }
        dualNote = noteInput;
        // Mark all previous laptops as 'old' in their note field
        for (const prev of alreadyAssigned) {
          await updateDoc(doc(db, 'assets', prev.id), { note: 'old' });
        }
      }
    }
    try {
      await updateDoc(doc(db, 'assets', asset.id), {
        name: editForm.name,
        mtuAssetTag: editForm.mtuAssetTag,
        dellAssetTag: editForm.dellAssetTag,
        serviceTag: editForm.serviceTag,
        status: editForm.status,
        fullName: editForm.fullName,
        ykdNumber: editForm.ykdNumber,
        note: dualNote || asset.note || ''
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
    const matchesSearch =
      (asset.name && asset.name.toLowerCase().includes(q)) ||
      (asset.room && asset.room.toLowerCase().includes(q)) ||
      (asset.firstName && asset.firstName.toLowerCase().includes(q)) ||
      (asset.lastName && asset.lastName.toLowerCase().includes(q)) ||
      (asset.mtuAssetTag && String(asset.mtuAssetTag).toLowerCase().includes(q)) ||
      (asset.dellAssetTag && String(asset.dellAssetTag).toLowerCase().includes(q)) ||
      (asset.serviceTag && String(asset.serviceTag).toLowerCase().includes(q)) ||
      (asset.ykdNumber && `ykd${asset.ykdNumber}`.toLowerCase().includes(q));
    const matchesStatus = !statusFilter || (asset.status && asset.status === statusFilter);
    return matchesSearch && matchesStatus;
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

  // Import handler
  const fileInputRef = useRef();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    // Helper to normalize keys: trim, remove commas, and lowercase
    const normalizeKeys = (row) => {
      const norm = {};
      Object.keys(row).forEach(k => {
        // Remove all leading/trailing whitespace and commas
        const cleanKey = k.replace(/^[\s,]+|[\s,]+$/g, '').toLowerCase();
        norm[cleanKey] = row[k];
      });
      return norm;
    };
    // Helper to get value by possible keys
    const getVal = (row, keys) => {
      for (const k of keys) {
        if (row[k]) return row[k];
      }
      return '';
    };
    if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const imported = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        let importedCount = 0;
        let skippedCount = 0;
        for (const origRow of imported) {
          const row = normalizeKeys(origRow);
          // Only skip if ALL key fields are empty
          if (!row["laptop name"] && !row["mtu asset tag"] && !row["dell asset tag"] && !row["service tag"] && !row["status"] && !row["note"] && !row["ykd number"] && !row["full name"]) {
            skippedCount++;
            continue;
          }
          importedCount++;
          let name = row["laptop name"] ? row["laptop name"].trim() : '';
          const dellAssetTag = row["dell asset tag"] ? row["dell asset tag"].trim() : '';
          if (!name && dellAssetTag) {
            let code = '';
            const match = dellAssetTag.match(/PCAMA(\w{4,})/i);
            if (match) {
              code = match[1].toUpperCase();
            } else {
              code = dellAssetTag.slice(-5).toUpperCase();
            }
            name = `QDFWCLPA${code}`;
          }
          // Normalize status to match select options
          let rawStatus = getVal(row, ["status"]);
          let status = "In Stock";
          if (typeof rawStatus === "string" && rawStatus.trim()) {
            const s = rawStatus.trim().toLowerCase();
            if (s === "deployed") status = "Deployed";
            else if (s === "on process to dell") status = "On Process to Dell";
            else if (s === "shipped to dell") status = "Shipped to Dell";
            else status = "In Stock";
          }
          const asset = {
            name,
            mtuAssetTag: getVal(row, ["mtu asset tag"]),
            dellAssetTag,
            ykdNumber: getVal(row, ["userkey", "ykd number", "ykd"]),
            serviceTag: getVal(row, ["service tag"]),
            status,
            note: getVal(row, ["note"]),
            fullName: getVal(row, ["full name"])
          };
          try {
            // Always generate a unique ID for each imported asset
            const id = Math.random().toString(36).slice(2) + Date.now();
            await setDoc(doc(db, "assets", id), asset);
          } catch (err) {}
        }
        alert(`Imported rows: ${importedCount}\nSkipped empty rows: ${skippedCount}`);
        if (e.target) e.target.value = '';
        alert("Import complete. Table will update automatically.");
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Unsupported file type. Please upload an .xlsx Excel file.');
    }
  };

  // Export handler
  const handleExport = () => {
    const exportCols = [
      { key: 'name', label: 'Laptop Name' },
      { key: 'mtuAssetTag', label: 'MTU Asset Tag' },
      { key: 'dellAssetTag', label: 'Dell Asset Tag' },
      { key: 'serviceTag', label: 'Service Tag' },
      { key: 'status', label: 'Status' },
      { key: 'note', label: 'Note' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'ykdNumber', label: 'YKD Number' },
    ];
    const csvRows = [exportCols.map(col => col.label)];
    sortedAssets.forEach(asset => {
      csvRows.push(exportCols.map(col => asset[col.key] || ''));
    });
    const csv = csvRows.map(row => row.map(val => `"${val}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'assets_export.csv');
  };

  // Find duplicate laptop names and track first occurrence
  const nameCounts = assets.reduce((acc, asset) => {
    const name = asset.name ? asset.name.trim().toLowerCase() : '';
    if (name) acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // Track which names have already been highlighted
  const highlightedNames = new Set();

  // --- Analytics Dashboard Data ---
  const statusCounts = assets.reduce((acc, asset) => {
    const s = (asset.status || '').trim();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // Find YKD numbers with both old and new laptops
  const ykdMap = {};
  assets.forEach(asset => {
    const ykd = asset.ykdNumber ? asset.ykdNumber.toString().trim() : '';
    if (!ykd) return;
    if (!ykdMap[ykd]) ykdMap[ykd] = { old: [], current: [] };
    if (asset.note === 'old') ykdMap[ykd].old.push(asset.name);
    else ykdMap[ykd].current.push(asset.name);
  });
  const ykdWithOldAndNew = Object.entries(ykdMap)
    .filter(([_, v]) => v.old.length && v.current.length)
    .map(([ykd, v]) => ({ ykd, old: v.old, current: v.current }));

  return (
    <div className="asset-container" style={containerStyle}>
      {/* Analytics Dashboard */}
      <div style={{background:'#fff', borderRadius:8, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'18px 18px 10px 18px', marginBottom:18, maxWidth:900, marginLeft:'auto', marginRight:'auto'}}>
        <h3 style={{color:'#1976d2', marginBottom:12}}>Analytics Dashboard</h3>
        <div style={{display:'flex', gap:24, flexWrap:'wrap', marginBottom:10}}>
          <div><b>In Stock:</b> {statusCounts['In Stock'] || 0}</div>
          <div><b>Deployed:</b> {statusCounts['Deployed'] || 0}</div>
          <div><b>On Process to Dell:</b> {statusCounts['On Process to Dell'] || 0}</div>
          <div><b>Shipped to Dell:</b> {statusCounts['Shipped to Dell'] || 0}</div>
        </div>
        <div style={{marginTop:10}}>
          <b>YKD Numbers with Old & New Laptops:</b>
          {ykdWithOldAndNew.length === 0 ? (
            <span style={{color:'#888', marginLeft:8}}>None</span>
          ) : (
            <ul style={{margin:'6px 0 0 18px', padding:0}}>
              {ykdWithOldAndNew.map(({ykd, old, current}) => (
                <li key={ykd} style={{marginBottom:4}}>
                  <span style={{color:'#1976d2', fontWeight:600}}>YKD{ykd}:</span> 
                  <span style={{color:'#e53935'}}>Old: {old.join(', ')}</span> | 
                  <span style={{color:'#43a047'}}>Current: {current.join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: "none" }}
          onChange={handleImport}
        />
        <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
          Import(.xlsx)
        </button>
        <button type="button" style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:5, padding:'8px 18px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}} onClick={handleExport}>
          Export
        </button>
      </div>
      {/* Responsive CSS injected */}
      <style>{responsiveStyle}</style>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginBottom:18}}>
        <h2 style={{...titleStyle, marginBottom:0}}>Inventory Assets</h2>
        <button
          style={{background:'#43a047', color:'#fff', border:'none', borderRadius:5, padding:'8px 18px', fontWeight:600, fontSize:'1rem', cursor:'pointer', marginLeft: 18}}
          onClick={() => setShowAddModal(true)}
        >Add</button>
      </div>
      <div style={{display:'flex', alignItems:'center', marginBottom:18, gap:12}}>
        {/* Enter Code button hidden as requested */}
        <button
          style={{background:'#1976d2', color:'#fff', border:'none', borderRadius:5, padding:'8px 18px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}}
          onClick={() => setShowAuditModal(true)}
        >Audit</button>
        {showAuditModal && (
                <div style={modalOverlay}>
                  <div className="asset-modal" style={{...modalContent, maxHeight: '80vh', minWidth: 400, overflowY: 'auto', padding: 18}}>
                    <button style={closeBtn} onClick={() => setShowAuditModal(false)} title="Close">×</button>
                    <h2 style={{color:'#1976d2', textAlign:'center', marginBottom:8}}>Audit: Users with Multiple Laptops</h2>
                    <div style={{marginBottom: 16}}>
                      <b>Users</b>
                    </div>
                    {usersWithMultiple.length === 0 ? (
                      <div style={{color:'#888'}}>No users with more than one laptop.</div>
                    ) : (
                      <ul style={{listStyle:'none', padding:0}}>
                        {usersWithMultiple.map(([ykd, devices]) => (
                          <li key={ykd} style={{marginBottom:18, borderBottom:'1px solid #eee', paddingBottom:10}}>
                            <div style={{fontWeight:600, color:'#1976d2', marginBottom:4}}>YKD{ykd}</div>
                            <ul style={{marginLeft:0, paddingLeft:16}}>
                              {devices.map(device => (
                                <li key={device.id || device.name} style={{marginBottom:4}}>
                                  <span style={{fontWeight:500}}>{device.name}</span>
                                  {device.note && (
                                    <span style={{marginLeft:8, color:'#888', fontSize:'0.97em'}}>({device.note})</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
        <div style={{position:'relative', flex:1, display:'flex', alignItems:'center'}}>
          <input
            style={{...searchBarStyle, marginBottom:0, width:'100%', paddingRight: 90}}
            type="text"
            placeholder="Search by name, room, rack, tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            type="button"
            style={{position:'absolute', right:8, top:6, background:'#1976d2', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', fontWeight:600, fontSize:'0.97rem', cursor:'pointer', zIndex:2}}
            onClick={() => setShowStatusDropdown(v => !v)}
          >
            Filter
          </button>
          {showStatusDropdown && (
            <div style={{position:'absolute', right:0, top:38, background:'#fff', border:'1px solid #1976d2', borderRadius:6, boxShadow:'0 2px 8px rgba(0,0,0,0.10)', zIndex:10, minWidth:170}}>
              {["", "In Stock", "Deployed", "On Process to Dell", "Shipped to Dell"].map(opt => (
                <div
                  key={opt || 'all'}
                  style={{padding:'8px 16px', cursor:'pointer', background: statusFilter === opt ? '#e3f2fd' : '#fff', color: opt ? '#1976d2' : '#888', fontWeight: statusFilter === opt ? 700 : 500}}
                  onClick={() => { setStatusFilter(opt); setShowStatusDropdown(false); }}
                >
                  {opt || 'All Statuses'}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Add button beside search bar is now hidden as requested */}
        {/* <button
          style={{background:'#43a047', color:'#fff', border:'none', borderRadius:5, padding:'8px 18px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}}
          onClick={() => setShowAddModal(true)}
        >Add</button> */}
      </div>
      <table className="asset-table" style={tableStyle}>
              {showAddModal && (
                <div style={modalOverlay}>
                  <div className="asset-modal" style={{...modalContent, maxHeight: '70vh', minWidth: 340, overflowY: 'auto', padding: 16}}>
                    <button style={closeBtn} onClick={() => setShowAddModal(false)} title="Close">×</button>
                    <h2 style={{color:'#1976d2', textAlign:'center', marginBottom:8}}>Add</h2>
                    <form style={{display:'flex', flexDirection:'column', gap:'12px'}} onSubmit={handleAddSubmit}>
                      <input
                        style={searchBarStyle}
                        name="mtuAssetTag"
                        placeholder="MTU Asset Tag"
                        value={newAsset.mtuAssetTag}
                        onChange={handleAddChange}
                      />
                      <label style={{fontWeight:500, color:'#1976d2', marginBottom:2}}>Dell Asset Tag <span style={{fontWeight:400, color:'#888', fontSize:'0.97em'}}>(leave empty if laptop doesn't have one)</span></label>
                      <input
                        style={searchBarStyle}
                        name="dellAssetTag"
                        placeholder="Dell Asset Tag"
                        value={newAsset.dellAssetTag}
                        onChange={e => {
                          handleAddChange(e);
                          const tag = e.target.value.trim();
                          if (tag && tag.length >= 8) {
                            let code = '';
                            const match = tag.match(/PCAMA(\w{4,})/i);
                            if (match) {
                              code = match[1].toUpperCase();
                            } else {
                              code = tag.slice(-5).toUpperCase();
                            }
                            setNewAsset(prev => ({ ...prev, name: `QDFWCLPA${code}` }));
                          } else if (!tag) {
                            // If Dell Asset Tag is cleared, auto-generate QDFWCLPC number
                            const pcPrefix = 'QDFWCLPC';
                            let maxNum = 0;
                            assets.forEach(asset => {
                              const match = asset.name && asset.name.match(/^QDFWCLPC(\d{4})$/);
                              if (match) {
                                const num = parseInt(match[1], 10);
                                if (num > maxNum) maxNum = num;
                              }
                            });
                            if (maxNum < 9999) {
                              const nextNum = (maxNum + 1).toString().padStart(4, '0');
                              setNewAsset(prev => ({ ...prev, name: `${pcPrefix}${nextNum}` }));
                            } else {
                              setNewAsset(prev => ({ ...prev, name: '' }));
                            }
                          }
                        }}
                      />
                      <input
                        style={searchBarStyle}
                        name="serviceTag"
                        placeholder="Service Tag"
                        value={newAsset.serviceTag}
                        onChange={handleAddChange}
                      />
                      <input
                        style={searchBarStyle}
                        name="name"
                        placeholder="Laptop Name"
                        value={newAsset.name}
                        onChange={handleAddChange}
                      />
                      <select
                        style={searchBarStyle}
                        name="status"
                        value={newAsset.status}
                        onChange={handleAddChange}
                      >
                        <option value="In Stock">In Stock</option>
                        <option value="Deployed">Deployed</option>
                        <option value="On Process to Dell">On Process to Dell</option>
                        <option value="Shipped to Dell">Shipped to Dell</option>
                      </select>

                      <input
                        style={searchBarStyle}
                        name="fullName"
                        placeholder="Full Name (if assigned)"
                        value={newAsset.fullName}
                        onChange={handleAddChange}
                      />
                      <input
                        style={searchBarStyle}
                        name="ykdNumber"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="YKD Number (if assigned)"
                        value={newAsset.ykdNumber}
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
              Laptop Name
              <span style={{marginLeft:8, color:'#fff', fontWeight:600, fontSize:'0.97rem'}}>
                (Total: {sortedAssets.length})
              </span>
              {sortArrow(sortBy==='name', sortDir)}
            </th>
            {/* <th onClick={() => handleSort('room')} style={{...thStyle, cursor:'pointer'}}>
              Room{sortArrow(sortBy==='room', sortDir)}
            </th> */}
            <th style={thStyle}>MTU Asset Tag</th>
            <th style={thStyle}>Dell Asset Tag</th>
            <th style={thStyle}>Service Tag</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Note</th>
            <th style={thStyle}>Full Name</th>
            <th style={thStyle}>First Name</th>
            <th style={thStyle}>Last Name</th>
            <th style={thStyle}>YKD Number</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedAssets.map((asset, idx) => {
            // Only highlight the first occurrence of each duplicate name
            let highlightName = false;
            const nameKey = asset.name ? asset.name.trim().toLowerCase() : '';
            if (nameKey && nameCounts[nameKey] > 1 && !highlightedNames.has(nameKey)) {
              highlightName = true;
              highlightedNames.add(nameKey);
            }
            const rowStyle = idx % 2 === 0 ? {} : trHoverStyle;
            return (
              <tr key={asset.id || asset.name + asset.room + asset.rack} style={rowStyle}>
                <td style={{
                  ...tdStyle,
                  color: highlightName ? '#e53935' : undefined,
                  fontWeight: highlightName ? 700 : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }} data-label="Name">
                  {asset.name}
                  {highlightName && (
                    <span title="Duplicate Laptop Name" style={{ color: '#e53935', fontSize: '1.1em', marginLeft: 2, verticalAlign: 'middle' }}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{display:'inline'}}><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.93 12.412h-1.86v-1.86h1.86v1.86zm0-3.72h-1.86V5.588h1.86v3.104z"/></svg>
                    </span>
                  )}
                </td>
              {/* <td style={tdStyle} data-label="Room">{asset.room}</td> */}
              <td style={tdStyle} data-label="MTU Asset Tag">{asset.mtuAssetTag}</td>
              <td style={tdStyle} data-label="Dell Asset Tag">{asset.dellAssetTag}</td>
              <td style={tdStyle} data-label="Service Tag">{asset.serviceTag}</td>
              <td style={tdStyle} data-label="Status">{asset.status}{asset.note === 'old' ? ' (old)' : ''}</td>
              <td style={tdStyle} data-label="Note">{asset.note}</td>
              <td style={tdStyle} data-label="Full Name">{asset.fullName}</td>
              <td style={tdStyle} data-label="First Name">{asset.firstName || (asset.fullName ? extractFirstAndLastName(asset.fullName).firstName : '')}</td>
              <td style={tdStyle} data-label="Last Name">{asset.lastName || (asset.fullName ? extractFirstAndLastName(asset.fullName).lastName : '')}</td>
              <td style={tdStyle} data-label="YKD Number">{asset.ykdNumber ? `YKD${asset.ykdNumber.toString().replace(/^YKD/i, '')}` : ''}</td>
              <td style={tdStyle} data-label="Actions">
                {showActionsIdx === idx ? (
                  <>
                    <button style={{marginRight:8, background:'#1976d2', color:'#fff', border:'none', borderRadius:4, padding:'4px 10px', cursor:'pointer'}} onClick={() => openEditModal(idx)}>Edit</button>
                    <button style={{background:'#e53935', color:'#fff', border:'none', borderRadius:4, padding:'4px 10px', cursor:'pointer'}} onClick={() => handleDelete(idx)}>Delete</button>
                    <button style={{marginLeft:8, background:'transparent', color:'#1976d2', border:'none', fontSize:'1.2rem', cursor:'pointer'}} onClick={() => setShowActionsIdx(null)} title="Hide actions">✕</button>
                  </>
                ) : (
                  <button style={{background:'transparent', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#1976d2'}} onClick={() => setShowActionsIdx(idx)} title="Show actions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  </button>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      {showEditModal && (
        <div style={modalOverlay}>
                  <div className="asset-modal" style={{...modalContent, maxHeight: '70vh', minWidth: 340, overflowY: 'auto', padding: 16}}>
            <button style={closeBtn} onClick={() => setShowEditModal(false)} title="Close">×</button>
            <h2 style={{color:'#1976d2', textAlign:'center', marginBottom:8}}>Edit Device</h2>
            <form style={{display:'flex', flexDirection:'column', gap:'12px'}} onSubmit={handleEditSubmit}>
              <input
                style={searchBarStyle}
                name="name"
                placeholder="Laptop Name"
                value={editForm.name}
                onChange={handleEditChange}
                disabled={!!editForm.dellAssetTag}
              />
              {editForm.dellAssetTag && (
                <div style={{color:'#e53935', fontSize:'0.97em', marginTop:-10, marginBottom:2}}>
                  Laptop Name is auto-generated from Dell Asset Tag. To change the name, edit the Dell Asset Tag.
                </div>
              )}
              <input
                style={searchBarStyle}
                name="mtuAssetTag"
                placeholder="MTU Asset Tag"
                value={editForm.mtuAssetTag}
                onChange={handleEditChange}
              />
              <input
                style={searchBarStyle}
                name="dellAssetTag"
                placeholder="Dell Asset Tag"
                value={editForm.dellAssetTag}
                onChange={e => {
                  handleEditChange(e);
                  const tag = e.target.value.trim();
                  if (tag && tag.length >= 8) {
                    let code = '';
                    const match = tag.match(/PCAMA(\w{4,})/i);
                    if (match) {
                      code = match[1].toUpperCase();
                    } else {
                      code = tag.slice(-5).toUpperCase();
                    }
                    setEditForm(prev => ({ ...prev, name: `QDFWCLPA${code}` }));
                  }
                }}
              />
              <input
                style={searchBarStyle}
                name="serviceTag"
                placeholder="Service Tag"
                value={editForm.serviceTag}
                onChange={handleEditChange}
              />
              <select
                style={searchBarStyle}
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
              >
                <option value="In Stock">In Stock</option>
                <option value="Deployed">Deployed</option>
                <option value="On Process to Dell">On Process to Dell</option>
                <option value="Shipped to Dell">Shipped to Dell</option>
              </select>
              <input
                style={searchBarStyle}
                name="fullName"
                placeholder="Full Name (if assigned)"
                value={editForm.fullName}
                onChange={handleEditChange}
              />
              <input
                style={searchBarStyle}
                name="ykdNumber"
                type="number"
                min="0"
                step="1"
                placeholder="Assign YKD Number"
                value={editForm.ykdNumber}
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
