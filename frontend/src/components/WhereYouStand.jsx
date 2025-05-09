// src/components/WhereYouStand.jsx

import React from "react";

const BUCKETS = [
  { label: "A", min: 800, max: 1000, color: "#4caf50" },
  { label: "B", min: 650, max: 799,  color: "#8bc34a" },
  { label: "C", min: 500, max: 649,  color: "#ffc107" },
  { label: "D", min: 350, max: 499,  color: "#ff9800" },
  { label: "F", min:   0, max: 349,  color: "#f44336" },
];

export default function WhereYouStand({ score }) {
  if (typeof score !== "number") return null;

  return (
    <div style={{ maxWidth: 300 }}>
      {BUCKETS.map(b => {
        const isCurrent = score >= b.min && score <= b.max;
        return (
          <div
            key={b.label}
            style={{
              display: "flex",
              alignItems: "center",
              background: b.color,
              padding: "4px 8px",
              marginBottom: 4,
              border: isCurrent ? "2px solid #000" : "none",
              borderRadius: 4,
              color: "#fff",
              position: "relative"
            }}
          >
            <div style={{ width: 30, fontWeight: "bold" }}>{b.label}</div>
            <div style={{ flex: 1, textAlign: "right" }}>
              {b.min}–{b.max}
            </div>
            {isCurrent && (
              <div style={{
                position: "absolute",
                right: -30,
                top: "50%",
                transform: "translateY(-50%)",
                background: "#000",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: "0.8rem"
              }}>
                {score}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
