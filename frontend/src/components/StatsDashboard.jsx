// src/components/StatsDashboard.jsx

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000";

const FEATURES = [
  "CNT_CHILDREN",
  "CNT_FAM_MEMBERS",
  "AGE_YEARS",
  "EMPLOYED_YEARS",
  "AMT_INCOME_TOTAL",
  "AMT_CREDIT",
  "AMT_ANNUITY",
  "AMT_GOODS_PRICE",
  "DAYS_LAST_PHONE_CHANGE",
  "CODE_GENDER",
  "NAME_FAMILY_STATUS",
  "NAME_EDUCATION_TYPE",
  "NAME_INCOME_TYPE",
  "OCCUPATION_TYPE",
  "NAME_HOUSING_TYPE",
];

export default function StatsDashboard({ clientId }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    Promise.all(
      FEATURES.map((f) =>
        axios
          .get(`${BASE_URL}/stats/${f}/${clientId}`)
          .then((r) => ({ feat: f, data: r.data.stat }))
          .catch(() => null)
      )
    ).then((results) => {
      const map = {};
      results.forEach((r) => {
        if (r && r.data) map[r.feat] = r.data;
      });
      setStats(map);
      setLoading(false);
    });
  }, [clientId]);

  if (!clientId) return null;
  if (loading) return <p>Chargement des statistiques…</p>;

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feat) => {
        const s = stats[feat];
        if (!s) return null;

        let chartData;
        if (s.type === "numeric") {
          const bins = s.histogram.bins;
          const c0 = s.histogram.counts["0"];
          const c1 = s.histogram.counts["1"];
          chartData = c0.map((val, i) => {
            const mid = ((bins[i] + bins[i + 1]) / 2).toFixed(0);
            return { bin: mid, good: val, bad: c1[i] };
          });
        } else {
          chartData = Object.entries(s.categories).map(([cat, counts]) => ({
            category: cat,
            good: counts["0"],
            bad: counts["1"],
          }));
        }

        return (
          <div
            key={feat}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <h3 className="text-lg font-semibold mb-2">{feat}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey={s.type === "numeric" ? "bin" : "category"} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="good" name="Remboursé" />
                <Bar dataKey="bad" name="Défaillant" />
                {s.type === "numeric" && s.client_bucket != null && (() => {
                  const idx = s.client_bucket - 1;
                  const xVal = ((s.histogram.bins[idx] + s.histogram.bins[idx + 1]) / 2).toFixed(0);
                  return <ReferenceLine x={xVal} stroke="red" label="Vous" />;
                })()}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
