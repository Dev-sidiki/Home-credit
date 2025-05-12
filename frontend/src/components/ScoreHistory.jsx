// frontend/src/components/ScoreHistory.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import axios from "axios";

export default function ScoreHistory({ clientId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!clientId) {
      setHistory([]);
      return;
    }

    axios
      .get(`/dossiers?client_id=${clientId}&all=true`)
      .then((r) => {
        // Trier par date de création croissante
        const sorted = r.data.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        // Mapper en format { timestamp, score }
        const mapped = sorted.map((d) => ({
          timestamp: new Date(d.created_at).toLocaleDateString(),
          score: d.score,
        }));
        setHistory(mapped);
      })
      .catch(() => {
        setHistory([]);
      });
  }, [clientId]);

  if (!history.length) return <p>Aucun historique de dossiers</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={history}>
        <XAxis dataKey="timestamp" />
        <YAxis domain={[0, 1000]} />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
