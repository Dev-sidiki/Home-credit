import React, { useState } from "react";

const ClientSearch = ({ onSearch }) => {
  const [clientId, setClientId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clientId) {
      onSearch(clientId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <input
        type="text"
        placeholder="Entrez l'ID client"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <button type="submit">Rechercher</button>
    </form>
  );
};

export default ClientSearch;
