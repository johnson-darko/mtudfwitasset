import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const defaultOrg = 'MTU Maintenance Fort Worth';

function generateEmail(first, last) {
  // Remove spaces from first name(s), capitalize first letters
  const firstPart = first.replace(/\s+/g, '');
  return `${firstPart}.${last}@mtu.aero`;
}

export default function UserForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const guid = uuidv4();
    const type = 0;
    const email = generateEmail(firstName, lastName);
    setSubmitted({ guid, type, firstName, lastName, organization: defaultOrg, email });
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>First Name(s):<br />
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Last Name:<br />
            <input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ width: '100%' }} />
          </label>
        </div>
        <button type="submit" style={{ padding: '8px 18px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}>Generate</button>
      </form>
      {submitted && (
        <div style={{ marginTop: 24, background: '#f4f6f8', padding: 16, borderRadius: 8 }}>
          <div><b>guid:</b> {submitted.guid}</div>
          <div><b>type:</b> {submitted.type}</div>
          <div><b>firstname:</b> {submitted.firstName}</div>
          <div><b>lastname:</b> {submitted.lastName}</div>
          <div><b>organization:</b> {submitted.organization}</div>
          <div><b>email:</b> {submitted.email}</div>
        </div>
      )}
    </div>
  );
}
