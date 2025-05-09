// src/components/ClientSearch.jsx
import React, { useState } from "react";
export default function ClientSearch({ onSearch }) {
  const [clientId, setClientId] = useState("");
  return (
    <form onSubmit={e=>{e.preventDefault();onSearch(clientId);}} className="search-form">
      <input type="text" placeholder="ID client" value={clientId}
             onChange={e=>setClientId(e.target.value)} />
      <button type="submit">Rechercher</button>
    </form>
  );
}
