// src/components/ScoreHistory.jsx

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";

export default function ScoreHistory({ clientId }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/history/${clientId}`).then((r) =>
      setHistory(
        r.data.history.map((d) => ({
          ...d,
          timestamp: new Date(d.timestamp).toLocaleDateString(),
        }))
      )
    );
  }, [clientId]);

  if (!history.length) return <p>Aucun historique</p>;

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
