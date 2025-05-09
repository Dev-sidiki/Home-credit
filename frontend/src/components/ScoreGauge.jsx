// src/components/ScoreGauge.jsx

import React from "react";
import { RadialBarChart, RadialBar } from "recharts";

const LETTER_THRESHOLDS = [
  { label: "A", min: 800, max: 1000, color: "#4caf50" },
  { label: "B", min: 650, max: 799,  color: "#8bc34a" },
  { label: "C", min: 500, max: 649,  color: "#ffc107" },
  { label: "D", min: 350, max: 499,  color: "#ff9800" },
  { label: "F", min:   0, max: 349,  color: "#f44336" },
];

function getBucket(score) {
  return LETTER_THRESHOLDS.find(b => score >= b.min && score <= b.max)
         || { label: "?", color: "#999" };
}

export default function ScoreGauge({ score }) {
  if (typeof score !== "number") {
    return <p>Chargement du score…</p>;
  }

  const { label, color } = getBucket(score);

  // un seul slice : votre score
  const data = [{ value: score, fill: color }];

  return (
    <div style={{ position: "relative", width: 200, height: 200 }}>
      <RadialBarChart
        width={200}
        height={200}
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        barSize={20}
        data={data}
        startAngle={90}
        endAngle={-270}
      >
        {/* background=true trace l’anneau gris complet */}
        <RadialBar
          background
          dataKey="value"
          cornerRadius={10}
        />
      </RadialBarChart>

      {/* Texte centré */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          textAlign: "center",
          pointerEvents: "none"
        }}
      >
        <div style={{ fontSize: "2rem", fontWeight: "bold", color }}>
          {score}
        </div>
        <div style={{ fontSize: "1rem", fontWeight: "600", color }}>
          {label}
        </div>
      </div>
    </div>
  );
}
