import React, { useState } from "react";
import axios from "axios";
import ClientSearch from "./components/ClientSearch";
import ClientInfo from "./components/ClientInfo";
import "./App.css";
const App = () => {
  const [clientData, setClientData] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = (id) => {
    axios
      .get(`http://127.0.0.1:5000/client/${id}`)
      .then((res) => {
        console.log("Reçu de l'API :", res.data);
        if (res.data && res.data.client) {
          console.log("Client trouvé :", res.data.client);
          setClientData(res.data.client);
          setError("");
        } else {
          console.warn("Structure inattendue :", res.data);
          setClientData(null);
          setError("Format de réponse incorrect");
        }
      })
      .catch((err) => {
        console.error("Erreur de requête :", err);
        setClientData(null);
        setError("Client non trouvé");
      });
  };

  console.log(clientData);

  return (
    <div className="App">
      <h1>Dashboard Home Credit</h1>
      <ClientSearch onSearch={handleSearch} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ClientInfo data={clientData} />
    </div>
  );
};

export default App;
