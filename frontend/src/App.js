// src/App.js

import React, { useState } from "react";
import axios from "axios";
import ClientSearch from "./components/ClientSearch";
import ClientInfo from "./components/ClientInfo";
import StatsDashboard from "./components/StatsDashboard";
import ScoreGauge from "./components/ScoreGauge";
import ScoreHistory from "./components/ScoreHistory";
import WhereYouStand from "./components/WhereYouStand";
import "./App.css";

const BASE_URL = "http://127.0.0.1:5000";

const App = () => {
  const [clientData, setClientData] = useState(null);
  const [clientId, setClientId]     = useState(null);
  const [score, setScore]           = useState(null);
  const [error, setError]           = useState("");

  const handleSearch = async (id) => {
    const cid = parseInt(id, 10);
    if (isNaN(cid)) {
      setError("ID invalide");
      setClientData(null);
      setClientId(null);
      setScore(null);
      return;
    }
    setClientId(cid);
    setError("");

    try {
      // fetch client info
      const res = await axios.get(`${BASE_URL}/client/${cid}`);
      const payload = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (payload.status !== "ok" || !payload.client) {
        throw new Error(payload.message || "Format de réponse incorrect");
      }
      setClientData(payload.client);

      // fetch stored score
      const pr = await axios.post(`${BASE_URL}/predict/${cid}`);
      setScore(pr.data.score);
    } catch (err) {
      console.error(err);
      setClientData(null);
      setScore(null);
      if (err.response?.status === 404) setError("Client non trouvé");
      else setError(err.message || "Erreur réseau ou serveur");
    }
  };

  return (
    <div className="App p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Home Credit</h1>

      <ClientSearch onSearch={handleSearch} />
      {error && <p className="text-red-600">{error}</p>}

      <ClientInfo data={clientData} />

      {clientData && score != null && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Votre score</h2>
              <ScoreGauge score={score} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Where You Stand</h2>
              <WhereYouStand score={score} />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">My Score History</h2>
            <ScoreHistory clientId={clientId} />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Analyse Statistique</h2>
            <StatsDashboard clientId={clientId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
