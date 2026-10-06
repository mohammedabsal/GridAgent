import React from 'react';

interface IsometricDataCenterSceneProps {
  isHighCarbon: boolean;
  isRunning: boolean;
  computeLoadPct: number;
  renewablePct: number;
}

export const IsometricDataCenterScene: React.FC<
  IsometricDataCenterSceneProps
> = ({ isHighCarbon, isRunning }) => {
  const rackPositions = [
    { x: 150, y: 115, h: 68, delay: '0s' },
    { x: 205, y: 92, h: 72, delay: '0.3s' },
    { x: 260, y: 69, h: 66, delay: '0.6s' },
    { x: 195, y: 142, h: 74, delay: '0.2s' },
    { x: 250, y: 118, h: 78, delay: '0.5s' },
    { x: 305, y: 95, h: 70, delay: '0.8s' },
    { x: 245, y: 168, h: 72, delay: '0.4s' },
    { x: 300, y: 144, h: 76, delay: '0.7s' },
  ];

  return (
    <svg
      viewBox="0 0 680 285"
      className="w-full h-full select-none pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Background radial glow */}
        <radialGradient id="twinStageGlow" cx="52%" cy="52%" r="52%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.24" />
          <stop offset="45%" stopColor="#10b981" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#040914" stopOpacity="0" />
        </radialGradient>

        {/* Isometric Platform Gradient */}
        <linearGradient id="isoPlatformTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f243c" />
          <stop offset="50%" stopColor="#091526" />
          <stop offset="100%" stopColor="#06101e" />
        </linearGradient>

        {/* Server Rack Gradients */}
        <linearGradient id="rackLeftFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
        <linearGradient id="rackRightFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#132847" />
          <stop offset="100%" stopColor="#07101f" />
        </linearGradient>
        <linearGradient id="rackTopFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.65" />
        </linearGradient>

        {/* Battery Tower Gradients */}
        <linearGradient id="batteryLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#062e24" />
        </linearGradient>
        <linearGradient id="batteryRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#04221b" />
        </linearGradient>

        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient Stage Glow */}
      <ellipse cx="340" cy="160" rx="310" ry="125" fill="url(#twinStageGlow)" />

      {/* Background Perspective Grid Lines */}
      <g stroke="#132846" strokeWidth="0.7" opacity="0.55">
        <line x1="60" y1="220" x2="310" y2="95" />
        <line x1="110" y1="240" x2="360" y2="115" />
        <line x1="160" y1="260" x2="410" y2="135" />
        <line x1="210" y1="275" x2="460" y2="150" />
        <line x1="260" y1="285" x2="520" y2="160" />
        <line x1="120" y1="105" x2="420" y2="255" />
        <line x1="170" y1="85" x2="470" y2="235" />
        <line x1="220" y1="70" x2="520" y2="215" />
      </g>

      {/* Energy Flow Conduits from Left Cards (Solar, Wind, Grid) into Isometric Platform */}
      {/* 1. Solar Conduit (Green) */}
      <path
        d="M 8 62 C 65 62, 85 128, 142 145"
        fill="none"
        stroke="#10b981"
        strokeWidth="2.8"
        filter="url(#neonGlow)"
        opacity="0.9"
      />
      <circle r="3.5" fill="#6ee7b7" filter="url(#neonGlow)">
        <animateMotion
          dur="2.2s"
          repeatCount="indefinite"
          path="M 8 62 C 65 62, 85 128, 142 145"
        />
      </circle>

      {/* 2. Wind Conduit (Cyan) */}
      <path
        d="M 8 144 C 58 144, 92 155, 148 162"
        fill="none"
        stroke="#06b6d4"
        strokeWidth="2.8"
        filter="url(#neonGlow)"
        opacity="0.9"
      />
      <circle r="3.5" fill="#67e8f9" filter="url(#neonGlow)">
        <animateMotion
          dur="2.5s"
          repeatCount="indefinite"
          path="M 8 144 C 58 144, 92 155, 148 162"
        />
      </circle>

      {/* 3. Grid Conduit (Amber/Red when High Carbon, Emerald when Clean) */}
      <path
        d="M 8 225 C 65 225, 95 190, 155 178"
        fill="none"
        stroke={isHighCarbon ? '#f59e0b' : '#10b981'}
        strokeWidth="2.8"
        filter="url(#neonGlow)"
        opacity="0.9"
      />
      <circle
        r="3.5"
        fill={isHighCarbon ? '#fcd34d' : '#6ee7b7'}
        filter="url(#neonGlow)"
      >
        <animateMotion
          dur="1.9s"
          repeatCount="indefinite"
          path="M 8 225 C 65 225, 95 190, 155 178"
        />
      </circle>

      {/* Isometric Data Center Base Platform */}
      <polygon
        points="115,168 275,92 435,172 275,254"
        fill="url(#isoPlatformTop)"
        stroke="#38bdf8"
        strokeWidth="1.6"
        strokeOpacity="0.65"
      />
      {/* Platform Side Thickness */}
      <polygon
        points="115,168 275,254 275,266 115,180"
        fill="#071324"
        stroke="#1e3a5f"
        strokeWidth="1"
      />
      <polygon
        points="435,172 275,254 275,266 435,184"
        fill="#040c18"
        stroke="#0ea5e9"
        strokeWidth="1"
        strokeOpacity="0.45"
      />

      {/* Glowing Perimeter Green Foliage / Eco Border */}
      {[
        [135, 182],
        [155, 193],
        [178, 205],
        [200, 217],
        [224, 229],
        [248, 241],
      ].map(([gx, gy], idx) => (
        <g key={idx}>
          <circle
            cx={gx}
            cy={gy}
            r="6.5"
            fill="#059669"
            opacity="0.75"
          />
          <circle
            cx={gx - 2}
            cy={gy - 2}
            r="4"
            fill="#34d399"
            opacity="0.85"
          />
        </g>
      ))}

      {/* 8 Isometric 3D Server Racks */}
      {rackPositions.map((rk, i) => {
        const w = 22;
        const d = 11;
        const topY = rk.y - rk.h;
        return (
          <g key={i}>
            {/* Left Face */}
            <polygon
              points={`${rk.x - w},${topY + d} ${rk.x},${topY + d * 2} ${rk.x},${
                rk.y + d * 2
              } ${rk.x - w},${rk.y + d}`}
              fill="url(#rackLeftFace)"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />
            {/* Right Face */}
            <polygon
              points={`${rk.x},${topY + d * 2} ${rk.x + w},${topY + d} ${
                rk.x + w
              },${rk.y + d} ${rk.x},${rk.y + d * 2}`}
              fill="url(#rackRightFace)"
              stroke="#0284c7"
              strokeWidth="0.8"
              strokeOpacity="0.6"
            />
            {/* Top Face */}
            <polygon
              points={`${rk.x},${topY} ${rk.x + w},${topY + d} ${rk.x},${
                topY + d * 2
              } ${rk.x - w},${topY + d}`}
              fill="url(#rackTopFace)"
              stroke="#7dd3fc"
              strokeWidth="0.9"
            />

            {/* Glowing Server Blade LEDs on Left Face */}
            {[0.22, 0.42, 0.62, 0.82].map((ratio, bIdx) => {
              const ly = topY + d + rk.h * ratio;
              const isAmber = (i + bIdx) % 5 === 0;
              return (
                <line
                  key={bIdx}
                  x1={rk.x - w + 4}
                  y1={ly}
                  x2={rk.x - 4}
                  y2={ly + d - 2}
                  stroke={
                    isAmber
                      ? '#fbbf24'
                      : isRunning
                      ? '#38bdf8'
                      : '#10b981'
                  }
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        );
      })}

      {/* Conduit from Data Center to Right-Side 3D Battery Energy Storage Tower */}
      <path
        d="M 415 170 C 475 175, 520 175, 575 155"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        filter="url(#neonGlow)"
      />
      <path
        d="M 400 185 C 465 195, 525 192, 582 170"
        fill="none"
        stroke="#10b981"
        strokeWidth="2.2"
        filter="url(#neonGlow)"
      />
      <circle r="3.5" fill="#34d399" filter="url(#neonGlow)">
        <animateMotion
          dur="2.1s"
          repeatCount="indefinite"
          path="M 400 185 C 465 195, 525 192, 582 170"
        />
      </circle>

      {/* Right-Side Isometric 3D Battery Storage Tower */}
      <g transform="translate(595, 68)">
        {/* Platform Base */}
        <polygon
          points="-42,102 0,82 42,102 0,122"
          fill="#06281e"
          stroke="#10b981"
          strokeWidth="1.2"
        />
        {/* Left Face */}
        <polygon
          points="-30,22 0,36 0,108 -30,94"
          fill="url(#batteryLeft)"
          stroke="#10b981"
          strokeWidth="1"
        />
        {/* Right Face */}
        <polygon
          points="0,36 30,22 30,94 0,108"
          fill="url(#batteryRight)"
          stroke="#34d399"
          strokeWidth="1"
        />
        {/* Top Face */}
        <polygon
          points="0,8 30,22 0,36 -30,22"
          fill="#10b981"
          fillOpacity="0.55"
          stroke="#6ee7b7"
          strokeWidth="1.2"
        />
        {/* Glowing Charge Level Bars */}
        {[48, 62, 76, 90].map((by, idx) => (
          <g key={idx}>
            <line
              x1="-22"
              y1={by - 6}
              x2="-6"
              y2={by + 2}
              stroke="#6ee7b7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="6"
              y1={by + 2}
              x2="22"
              y2={by - 6}
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    </svg>
  );
};

export const HolographicAIBrain: React.FC = () => (
  <svg viewBox="0 0 120 135" className="w-24 h-28 shrink-0 select-none">
    <defs>
      <radialGradient id="aiHeadGlow" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#0284c7" stopOpacity="0.20" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Halo Glow */}
    <circle cx="60" cy="58" r="52" fill="url(#aiHeadGlow)" />
    <circle
      cx="60"
      cy="58"
      r="44"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="0.8"
      strokeDasharray="3 3"
      opacity="0.65"
    />

    {/* Stylized Cybernetic Head Silhouette & Neural Nodes */}
    <path
      d="M36,98 L38,76 C30,68 28,52 32,38 C37,22 50,16 64,16 C80,16 92,26 94,42 C96,52 93,60 88,68 L84,82 C82,88 76,91 70,91 L66,91 L66,105 L36,98 Z"
      fill="#082f49"
      fillOpacity="0.75"
      stroke="#38bdf8"
      strokeWidth="1.6"
    />

    {/* Neural Mesh Lines */}
    <g stroke="#7dd3fc" strokeWidth="0.9" opacity="0.8">
      <line x1="45" y1="34" x2="65" y2="28" />
      <line x1="65" y1="28" x2="80" y2="40" />
      <line x1="45" y1="34" x2="54" y2="50" />
      <line x1="54" y1="50" x2="75" y2="48" />
      <line x1="75" y1="48" x2="80" y2="40" />
      <line x1="54" y1="50" x2="48" y2="68" />
      <line x1="75" y1="48" x2="72" y2="66" />
      <line x1="48" y1="68" x2="72" y2="66" />
    </g>

    {/* Glowing Neural Nodes */}
    {[
      [45, 34],
      [65, 28],
      [80, 40],
      [54, 50],
      [75, 48],
      [48, 68],
      [72, 66],
    ].map(([nx, ny], idx) => (
      <circle
        key={idx}
        cx={nx}
        cy={ny}
        r="2.8"
        fill="#e0f2fe"
        stroke="#38bdf8"
        strokeWidth="1.2"
      />
    ))}
  </svg>
);

