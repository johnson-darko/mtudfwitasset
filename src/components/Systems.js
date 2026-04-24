import React, { useEffect, useState, useRef } from 'react';

const SYSTEM_COLUMNS = [
  'System-Name', 'DNS-Name', 'Status', 'Domain', 'Employee No', 'Lastname', 'Firstname',
  'Department', 'System Performance Group', 'Operating System', 'Mandant', 'Serialnumber', 'Manufacturer'
];

export default function Systems() {
  const [systems, setSystems] = useState([]);
  const [userNames, setUserNames] = useState([]);
  const fileInputRef = useRef();

  // Load user first/last names and saved systems from localStorage
  useEffect(() => {
    try {
      const users = JSON.parse(localStorage.getItem('userFormUsers')) || [];
      setUserNames(users.map(u => ({ firstName: u.firstName, lastName: u.lastName, employeeNo: u.employeeNo || '' })));
    } catch {
      setUserNames([]);
    }
    try {
      const savedSystems = JSON.parse(localStorage.getItem('systemsTable')) || [];
      setSystems(savedSystems);
    } catch {
      setSystems([]);
    }
  }, []);

  // Example: Add system row (expand as needed)
  const handleAddSystem = () => {
    setSystems([
      ...systems,
      {
        'System-Name': '', 'DNS-Name': '', 'Status': '', 'Domain': '', 'Employee No': '',
        'Lastname': '', 'Firstname': '', 'Department': '', 'System Performance Group': '',
        'Operating System': '', 'Mandant': '', 'Serialnumber': '', 'Manufacturer': ''
      }
    ]);
  };

  // Example: Save to localStorage (optional)
  const handleSave = () => {
    localStorage.setItem('systemsTable', JSON.stringify(systems));
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 700, color: '#1976d2' }}>Systems Table</h2>
      <button onClick={handleAddSystem} style={{ marginBottom: 16, padding: '8px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>Add System</button>
      <button onClick={handleSave} style={{ marginLeft: 12, marginBottom: 16, padding: '8px 18px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>Save Table</button>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <thead style={{ background: '#1976d2', color: '#fff' }}>
          <tr>
            {SYSTEM_COLUMNS.map(col => <th key={col} style={{ padding: 10 }}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {systems.map((row, idx) => (
            <tr key={idx}>
              {SYSTEM_COLUMNS.map(col => (
                <td key={col} style={{ padding: 8 }}>
                  {(col === 'Lastname' || col === 'Firstname') ? (
                    <select
                      value={row[col]}
                      onChange={e => {
                        const updated = [...systems];
                        updated[idx][col] = e.target.value;
                        setSystems(updated);
                      }}
                    >
                      <option value="">Select</option>
                      {userNames.map((u, i) => (
                        col === 'Lastname'
                          ? <option key={i} value={u.lastName}>{u.lastName}</option>
                          : <option key={i} value={u.firstName}>{u.firstName}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={row[col] || ''}
                      onChange={e => {
                        const updated = [...systems];
                        updated[idx][col] = e.target.value;
                        setSystems(updated);
                      }}
                      style={{ width: '100%' }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
