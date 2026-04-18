import React, { useState } from 'react';
import ToolMateCheckOut from '../components/ToolMateCheckOut';

const SupervisorCheckInPanel = ({ checkOuts }) => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div style={{marginTop: 32, background: '#e3eafc', borderRadius: 8, padding: 18}}>
      <h2 style={{color:'#1976d2', textAlign:'center'}}>Check In Tools</h2>
      {checkOuts.length === 0 ? (
        <div style={{color:'#888', textAlign:'center'}}>No tools awaiting check-in.</div>
      ) : (
        checkOuts.map(entry => (
          <div key={entry.id} style={{marginBottom: 18, background:'#fff', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', padding:14}}>
            <b>{entry.tool}</b> checked out by <b>{entry.name}</b><br/>
            <span style={{fontSize:'0.97rem', color:'#555'}}>Time: {entry.time}</span><br/>
            {entry.note && <span style={{fontSize:'0.97rem', color:'#555'}}>Note: {entry.note}</span>}<br/>
            <button
              style={{marginTop:8, padding:'7px 16px', background:'#1976d2', color:'#fff', border:'none', borderRadius:'5px', fontWeight:600, fontSize:'1rem', cursor:'pointer'}}
              onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
            >
              {selectedId === entry.id ? 'Hide Check-In Form' : 'Check In'}
            </button>
            {selectedId === entry.id && (
              <ToolMateCheckOut entry={entry} onCheckedIn={() => setSelectedId(null)} />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SupervisorCheckInPanel;
