import React, { useEffect, useRef } from 'react';

/**
 * Animated SVG arc gauge showing code strength 0-100.
 * Colour: red (0-40) → amber (41-70) → green (71-100)
 */
const StrengthGauge = ({ score = 0, label = '', breakdown = {} }) => {
  const circleRef = useRef(null);

  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half-circle arc
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 71) return '#10b981';   // green
    if (s >= 41) return '#f59e0b';   // amber
    return '#ef4444';                // red
  };
  const color = getColor(score);

  const breakdownItems = [
    { key: 'complexity',       label: 'Complexity',       max: 35 },
    { key: 'maintainability',  label: 'Maintainability',  max: 25 },
    { key: 'comment_ratio',    label: 'Comments',         max: 15 },
    { key: 'clean_imports',    label: 'Clean Imports',    max: 15 },
    { key: 'function_length',  label: 'Fn Length',        max: 10 },
  ];

  return (
    <div>
      {/* Arc gauge */}
      <div className="gauge-wrapper">
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Track */}
          <path
            d={describeArc(size / 2, size / 2, radius, -180, 0)}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            ref={circleRef}
            d={describeArc(size / 2, size / 2, radius, -180, 0)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease' }}
          />
          {/* Score text */}
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize="2rem"
            fontWeight="800"
            fontFamily="Inter, sans-serif"
          >
            {Math.round(score)}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 22}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="0.65rem"
            fontFamily="Inter, sans-serif"
            letterSpacing="0.12em"
          >
            / 100
          </text>
        </svg>

        <div className="gauge-label-text" style={{ color }}>
          {label}
        </div>
      </div>

      {/* Breakdown mini-bars */}
      <div className="breakdown-grid">
        {breakdownItems.map(({ key, label: lbl, max }) => {
          const val = breakdown[key] ?? 0;
          const pct = Math.min((val / max) * 100, 100);
          const barColor = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
          return (
            <div className="breakdown-item" key={key}>
              <div className="breakdown-label">{lbl}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="breakdown-bar-track" style={{ flex: 1 }}>
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '28px', textAlign: 'right' }}>
                  {val.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* SVG arc helper */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const s = polarToCartesian(cx, cy, r, endAngle);
  const e = polarToCartesian(cx, cy, r, startAngle);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 0 ${e.x} ${e.y}`;
}

export default StrengthGauge;
