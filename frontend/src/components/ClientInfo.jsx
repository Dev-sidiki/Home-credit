// src/components/ClientInfo.jsx
import React from "react";
export default function ClientInfo({ data }) {
  if (!data) return null;
  return (
    <div className="client-info">
      <h2>Données client</h2>
      <ul>
        {Object.entries(data).map(([k,v])=>(
          <li key={k}><strong>{k}</strong>: {v?.toString()}</li>
        ))}
      </ul>
    </div>
  );
}
