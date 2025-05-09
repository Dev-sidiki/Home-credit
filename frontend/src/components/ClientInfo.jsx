import React from "react";

const ClientInfo = ({ data }) => {
  console.log("ClientInfo reçoit :", data);

  // cc
  if (!data) {
    return <p>Aucun client sélectionné</p>;
  }

  return (
    <div className="client-info">
      <h2>Données client</h2>
      <ul>
        {Object.entries(data).map(([key, value]) => (
          <li key={key}>
            <strong>{key}</strong>: {value?.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientInfo;
