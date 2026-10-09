import React from 'react';

/* ------------------------------------------------------------------ */
/* Decorative line-art illustrations shared across the landing page.   */
/* All are aria-hidden — they add visual interest without carrying     */
/* meaning, and follow the same translucent stroke style as the hero   */
/* India-map backdrop and the Final-CTA energy scene.                  */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 1. AI control-room monitor — Features section                       */
/* ------------------------------------------------------------------ */

export const ChipBrainIllustration: React.FC = () => (
  <svg viewBox="0 0 480 340" className="h-auto w-full" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="gaDashArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
      </linearGradient>
      <linearGradient id="gaDashScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0fdfa" />
        <stop offset="100%" stopColor="#ecfdf5" />
      </linearGradient>
    </defs>

    {/* ground line tying the whole scene together */}
    <line x1="28" y1="300" x2="452" y2="300" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="248" cy="302" rx="86" ry="6" fill="#10b981" fillOpacity="0.08" />

    {/* monitor stand + base */}
    <path d="M212 258 L284 258 L296 288 L200 288 Z" fill="#d1fae5" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.6" strokeLinejoin="round" />
    <rect x="176" y="288" width="144" height="12" rx="6" fill="#a7f3d0" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.6" />

    {/* monitor body + screen */}
    <rect x="62" y="30" width="356" height="228" rx="18" fill="#ffffff" stroke="#059669" strokeOpacity="0.6" strokeWidth="2.2" />
    <rect x="76" y="44" width="328" height="190" rx="10" fill="url(#gaDashScreen)" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.4" />

    {/* title bar: window dots + tabs */}
    <circle cx="92" cy="58" r="3.5" fill="#f87171" fillOpacity="0.8" />
    <circle cx="104" cy="58" r="3.5" fill="#fbbf24" fillOpacity="0.8" />
    <circle cx="116" cy="58" r="3.5" fill="#34d399" fillOpacity="0.8" />
    <rect x="134" y="53" width="62" height="10" rx="5" fill="#10b981" fillOpacity="0.25" />
    <rect x="204" y="53" width="44" height="10" rx="5" fill="#10b981" fillOpacity="0.12" />

    {/* chart: gridlines, axis, clean-window band */}
    <g stroke="#10b981" strokeOpacity="0.14" strokeWidth="1">
      <line x1="102" y1="108" x2="380" y2="108" />
      <line x1="102" y1="150" x2="380" y2="150" />
    </g>
    <rect x="232" y="82" width="76" height="128" fill="#34d399" fillOpacity="0.14" />
    <line x1="232" y1="82" x2="232" y2="210" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.3" strokeDasharray="4 5" />
    <line x1="308" y1="82" x2="308" y2="210" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.3" strokeDasharray="4 5" />
    <rect x="240" y="86" width="60" height="16" rx="8" fill="#059669" fillOpacity="0.85" />
    <text x="270" y="98" fill="#ffffff" fontSize="9" fontWeight="800" letterSpacing="1" textAnchor="middle">CLEAN</text>
    <line x1="102" y1="210" x2="380" y2="210" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />

    {/* carbon curve + area fill */}
    <path d="M102 116 C 130 104, 150 162, 180 158 C 206 154, 220 116, 246 120 C 272 124, 282 186, 312 184 C 342 182, 356 130, 380 126 L380 210 L102 210 Z" fill="url(#gaDashArea)" />
    <path className="ga-flow" d="M102 116 C 130 104, 150 162, 180 158 C 206 154, 220 116, 246 120 C 272 124, 282 186, 312 184 C 342 182, 356 130, 380 126" fill="none" stroke="#059669" strokeWidth="2.6" strokeLinecap="round" />

    {/* dirty peak + clean trough markers */}
    <circle cx="152" cy="144" r="6" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.8" />
    <circle cx="300" cy="184" r="7" fill="#059669" fillOpacity="0.25" stroke="#059669" strokeWidth="2" className="ga-node-live" />
    {/* workload chip flying into the clean window */}
    <rect x="118" y="76" width="52" height="22" rx="7" fill="#ffffff" stroke="#059669" strokeOpacity="0.7" strokeWidth="1.6" />
    <g stroke="#059669" strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round">
      <line x1="127" y1="84" x2="161" y2="84" />
      <line x1="127" y1="91" x2="151" y2="91" />
    </g>
    <path d="M172 96 C 200 106, 216 132, 244 148" fill="none" stroke="#059669" strokeOpacity="0.8" strokeWidth="1.8" strokeDasharray="5 5" strokeLinecap="round" />
    <path d="M244 148 L233 143 M244 148 L235 155" fill="none" stroke="#059669" strokeOpacity="0.8" strokeWidth="1.8" strokeLinecap="round" />
    
    {/* landed chip in clean window */}
    <rect x="250" y="136" width="52" height="22" rx="7" fill="#34d399" fillOpacity="0.15" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="4 4" />
    <g stroke="#059669" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round">
      <line x1="259" y1="144" x2="293" y2="144" />
      <line x1="259" y1="151" x2="283" y2="151" />
    </g>

    {/* decision badge on the monitor corner */}
    <g transform="translate(360 16)">
      <rect x="0" y="0" width="82" height="32" rx="16" fill="#ffffff" stroke="#059669" strokeOpacity="0.6" strokeWidth="1.8" />
      <circle cx="18" cy="16" r="9" fill="#34d399" fillOpacity="0.25" />
      <path d="M14 16 L17.5 19.5 L23 12" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="34" y="10" width="36" height="5" rx="2.5" fill="#059669" fillOpacity="0.5" />
      <rect x="34" y="19" width="24" height="5" rx="2.5" fill="#059669" fillOpacity="0.28" />
    </g>

    {/* wind turbine standing on the ground */}
    <g transform="translate(56 300)">
      <path d="M-3 0 L-1.2 -72 L1.2 -72 L3 0 Z" fill="#d1fae5" stroke="#059669" strokeOpacity="0.55" strokeWidth="1.3" />
      <g transform="translate(0 -74)">
        <g className="ga-spin-slow" style={{ animationDuration: '13s' }} fill="#a7f3d0" stroke="#059669" strokeOpacity="0.65" strokeWidth="1.2" strokeLinejoin="round">
          <path d="M0 -3 L-4 -30 L4 -30 Z" />
          <path d="M0 -3 L-4 -30 L4 -30 Z" transform="rotate(120)" />
          <path d="M0 -3 L-4 -30 L4 -30 Z" transform="rotate(240)" />
        </g>
        <circle r="3.4" fill="#059669" fillOpacity="0.8" />
      </g>
    </g>

    {/* small server + tree balancing the right side */}
    <rect x="420" y="262" width="28" height="38" rx="5" fill="#ffffff" stroke="#059669" strokeOpacity="0.55" strokeWidth="1.5" />
    <g stroke="#059669" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round">
      <line x1="426" y1="271" x2="442" y2="271" />
      <line x1="426" y1="278" x2="442" y2="278" />
      <line x1="426" y1="285" x2="436" y2="285" />
    </g>
    <circle cx="440" cy="293" r="2" fill="#34d399" className="ga-node-live" />
    <g stroke="#059669" strokeOpacity="0.5" strokeWidth="1.5" fill="#d1fae5" fillOpacity="0.85">
      <circle cx="396" cy="278" r="13" />
      <line x1="396" y1="291" x2="396" y2="300" />
    </g>

    {/* floating leaf */}
    <g transform="translate(432 120) rotate(18)">
      <path d="M0 15 C-11 7 -11 -7 0 -13 C11 -7 11 7 0 15 Z" fill="#10b981" fillOpacity="0.2" stroke="#059669" strokeOpacity="0.65" strokeWidth="1.6" />
      <path d="M0 15 L0 -9" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.3" />
    </g>

  </svg>
);


/* ------------------------------------------------------------------ */
/* 2. Flowing node network — How It Works background                   */
/* ------------------------------------------------------------------ */

export const FlowNetworkBackdrop: React.FC = () => (
  <svg
    viewBox="0 0 1200 420"
    preserveAspectRatio="xMidYMid slice"
    className="pointer-events-none absolute inset-0 h-full w-full"
    aria-hidden="true"
    focusable="false"
  >
    {/* Drifting connection paths */}
    <g
      fill="none"
      stroke="#10b981"
      strokeOpacity="0.16"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path className="ga-flow" d="M-20 92 C 200 30, 400 150, 620 90 S 1000 30, 1220 108" />
      <path d="M-20 320 C 240 250, 420 380, 660 310 S 1020 260, 1220 330" strokeOpacity="0.12" />
      <path
        className="ga-flow"
        d="M140 420 C 200 300, 340 280, 420 170 S 620 60, 760 -20"
        strokeOpacity="0.12"
      />
    </g>

    {/* Nodes */}
    <g>
      {[
        [180, 70],
        [420, 118],
        [620, 90],
        [840, 58],
        [1040, 96],
        [300, 300],
        [560, 336],
        [760, 288],
        [980, 322],
        [140, 344],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle
            cx={cx}
            cy={cy}
            r="7"
            fill="#ecfdf5"
            stroke="#10b981"
            strokeOpacity="0.35"
            strokeWidth="1.6"
          />
          <circle cx={cx} cy={cy} r="2.5" fill="#10b981" fillOpacity="0.4" />
        </g>
      ))}
    </g>

    {/* Scattered diamonds */}
    <g stroke="#14b8a6" strokeOpacity="0.22" strokeWidth="1.4" fill="none">
      {[
        [330, 60],
        [700, 150],
        [900, 210],
        [500, 240],
        [1080, 250],
        [220, 210],
      ].map(([cx, cy]) => (
        <rect
          key={`d-${cx}-${cy}`}
          x={cx - 7}
          y={cy - 7}
          width="14"
          height="14"
          transform={`rotate(45 ${cx} ${cy})`}
        />
      ))}
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* 3. Layered architecture stack — Technology section                  */
/* ------------------------------------------------------------------ */

export const LayerStackIllustration: React.FC = () => (
  <svg
    viewBox="0 0 360 300"
    className="h-auto w-full"
    aria-hidden="true"
    focusable="false"
  >
    {/* Isometric stacked layers */}
    {[
      { y: 60, id: 3, fill: '#ecfdf5' },
      { y: 130, id: 2, fill: '#d1fae5' },
      { y: 200, id: 1, fill: '#a7f3d0' },
    ].map((layer) => (
      <g key={layer.id}>
        <path
          d={`M40 ${layer.y} L180 ${layer.y - 40} L320 ${layer.y} L180 ${layer.y + 40} Z`}
          fill={layer.fill}
          fillOpacity="0.85"
          stroke="#059669"
          strokeOpacity="0.5"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d={`M110 ${layer.y} L180 ${layer.y - 20} L250 ${layer.y}`}
          fill="none"
          stroke="#059669"
          strokeOpacity="0.3"
          strokeWidth="1.4"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
      </g>
    ))}

    {/* Vertical data conduits between layers */}
    <g stroke="#059669" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round">
      <line x1="180" y1="200" x2="180" y2="172" strokeDasharray="4 6" className="ga-flow" />
      <line x1="180" y1="130" x2="180" y2="102" strokeDasharray="4 6" className="ga-flow" />
    </g>

    {/* Top node: AI core */}
    <g transform="translate(180 6)">
      <circle r="16" fill="#ffffff" stroke="#059669" strokeOpacity="0.6" strokeWidth="1.8" />
      <circle r="6" fill="#10b981" className="ga-node-live" />
    </g>

    {/* Orbiting satellites */}
    <g fill="#059669" fillOpacity="0.55">
      <circle cx="52" cy="128" r="5" />
      <circle cx="312" cy="96" r="5" />
      <circle cx="300" cy="228" r="4" />
    </g>
    <g stroke="#059669" strokeOpacity="0.3" strokeWidth="1.3" fill="none">
      <path d="M52 128 Q90 100 132 96" strokeDasharray="4 6" />
      <path d="M312 96 Q276 76 238 74" strokeDasharray="4 6" />
      <path d="M300 228 Q264 236 236 224" strokeDasharray="4 6" />
    </g>

    {/* Ground shadow */}
    <ellipse cx="180" cy="262" rx="120" ry="14" fill="#059669" fillOpacity="0.08" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* 4. Clean-energy skyline — Use Cases section footer band             */
/* ------------------------------------------------------------------ */

export const CleanEnergySkyline: React.FC = () => (
  <svg
    viewBox="0 0 1200 180"
    preserveAspectRatio="xMidYMax slice"
    className="pointer-events-none block h-32 w-full sm:h-40"
    aria-hidden="true"
    focusable="false"
  >
    {/* rolling ground */}
    <path
      d="M0 150 Q200 138 420 146 T840 142 T1200 148 L1200 180 L0 180 Z"
      fill="#ecfdf5"
      fillOpacity="0.9"
    />
    <path
      d="M0 150 Q200 138 420 146 T840 142 T1200 148"
      fill="none"
      stroke="#10b981"
      strokeOpacity="0.4"
      strokeWidth="1.6"
    />

    {/* City blocks (data centers) */}
    <g fill="#ffffff" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1.6">
      <rect x="80" y="96" width="54" height="52" rx="4" />
      <rect x="146" y="72" width="40" height="76" rx="4" />
      <rect x="380" y="104" width="70" height="44" rx="4" />
      <rect x="700" y="88" width="46" height="60" rx="4" />
      <rect x="905" y="108" width="64" height="40" rx="4" />
    </g>
    {/* server rack slots */}
    <g stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round">
      <line x1="154" y1="86" x2="178" y2="86" />
      <line x1="154" y1="98" x2="178" y2="98" />
      <line x1="154" y1="110" x2="178" y2="110" />
      <line x1="154" y1="122" x2="178" y2="122" />
      <line x1="390" y1="116" x2="440" y2="116" />
      <line x1="390" y1="128" x2="440" y2="128" />
      <line x1="710" y1="102" x2="736" y2="102" />
      <line x1="710" y1="114" x2="736" y2="114" />
      <line x1="915" y1="120" x2="959" y2="120" />
      <line x1="915" y1="132" x2="959" y2="132" />
    </g>

    {/* Transmission pylon */}
    <g stroke="#10b981" strokeOpacity="0.5" strokeWidth="1.7" fill="none" strokeLinecap="round">
      <path d="M262 148 L276 62 M302 148 L288 62" />
      <path d="M267 122 L297 122 M271 100 L293 100 M274 82 L290 82" />
      <path d="M264 76 L300 76 M270 76 L267 86 M294 76 L297 86" />
    </g>

    {/* Power lines */}
    <g fill="none" stroke="#10b981" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round">
      <path className="ga-flow" d="M0 120 Q40 130 80 110" />
      <path className="ga-flow" d="M134 110 Q140 115 146 100" />
      <path className="ga-flow" d="M186 88 Q228 108 264 78" />
      <path className="ga-flow" d="M300 76 Q340 100 380 84" />
      <path className="ga-flow" d="M450 110 Q505 130 560 118" />
      <path className="ga-flow" d="M614 118 Q657 130 700 100" />
      <path className="ga-flow" d="M746 100 Q773 110 800 78" />
      <path className="ga-flow" d="M800 78 Q852 120 905 110" />
      <path className="ga-flow" d="M969 110 Q1029 130 1090 92" />
      <path className="ga-flow" d="M1090 92 Q1145 110 1200 100" />
    </g>

    {/* Solar roof */}
    <g transform="translate(560 148)">
      <path
        d="M-60 0 L-46 -30 L54 -30 L40 0 Z"
        fill="#d1fae5"
        fillOpacity="0.9"
        stroke="#0d9488"
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g stroke="#0d9488" strokeOpacity="0.35" strokeWidth="1.3">
        <line x1="-30" y1="-30" x2="-42" y2="0" />
        <line x1="-8" y1="-30" x2="-18" y2="0" />
        <line x1="14" y1="-30" x2="6" y2="0" />
        <line x1="36" y1="-30" x2="28" y2="0" />
        <line x1="-53" y1="-15" x2="47" y2="-15" />
      </g>
    </g>

    {/* Wind turbines */}
    {[
      { x: 800, hub: 78, r: 30, dur: '12s' },
      { x: 1090, hub: 92, r: 24, dur: '15s' },
    ].map((t) => (
      <g key={t.x}>
        <path
          d={`M${t.x - 3} 148 L${t.x - 1.2} ${t.hub} L${t.x + 1.2} ${t.hub} L${t.x + 3} 148 Z`}
          fill="#ffffff"
          stroke="#10b981"
          strokeOpacity="0.5"
          strokeWidth="1.3"
        />
        <g transform={`translate(${t.x} ${t.hub})`}>
          <g
            className="ga-spin-slow"
            style={{ animationDuration: t.dur }}
            fill="#a7f3d0"
            stroke="#059669"
            strokeOpacity="0.6"
            strokeWidth="1.2"
            strokeLinejoin="round"
          >
            <path d={`M0 -2.5 L-3.5 -${t.r} L3.5 -${t.r} Z`} />
            <path d={`M0 -2.5 L-3.5 -${t.r} L3.5 -${t.r} Z`} transform="rotate(120)" />
            <path d={`M0 -2.5 L-3.5 -${t.r} L3.5 -${t.r} Z`} transform="rotate(240)" />
          </g>
          <circle r="3.5" fill="#059669" fillOpacity="0.7" />
        </g>
      </g>
    ))}

    {/* Small tree cluster */}
    <g stroke="#059669" strokeOpacity="0.5" strokeWidth="1.5" fill="#d1fae5" fillOpacity="0.8">
      <circle cx="490" cy="132" r="13" />
      <line x1="490" y1="145" x2="490" y2="150" />
      <circle cx="656" cy="136" r="10" />
      <line x1="656" y1="146" x2="656" y2="150" />
      <circle cx="858" cy="134" r="12" />
      <line x1="858" y1="146" x2="858" y2="150" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* 5. Guarded shield — Safety section (dark background)                */
/* ------------------------------------------------------------------ */

export const ShieldGuardIllustration: React.FC = () => (
  <svg
    viewBox="0 0 360 300"
    className="h-auto w-full"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <radialGradient id="gaShieldGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#5eead4" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* soft glow behind the gate */}
    <circle cx="180" cy="150" r="140" fill="url(#gaShieldGlow)" />
    {/* guard rings */}
    <g fill="none" stroke="#5eead4" strokeOpacity="0.16" strokeWidth="1.4">
      <circle cx="180" cy="150" r="126" />
      <circle cx="180" cy="150" r="104" strokeDasharray="5 9" className="ga-flow" />
    </g>
    {/* ground line */}
    <line x1="20" y1="272" x2="340" y2="272" stroke="#5eead4" strokeOpacity="0.28" strokeWidth="1.6" strokeLinecap="round" />

    {/* three lanes: ALLOW (passes), DENY (deflects), ASK_USER (pauses) */}
    <g strokeLinecap="round">
      {/* ALLOW lane — through the shield */}
      <line x1="24" y1="86" x2="118" y2="86" stroke="#34d399" strokeOpacity="0.45" strokeWidth="1.6" strokeDasharray="6 6" className="ga-flow" />
      <line x1="244" y1="86" x2="336" y2="86" stroke="#34d399" strokeOpacity="0.45" strokeWidth="1.6" strokeDasharray="6 6" className="ga-flow" />
      {/* DENY lane — stops at the shield */}
      <line x1="24" y1="152" x2="106" y2="152" stroke="#fb7185" strokeOpacity="0.4" strokeWidth="1.6" strokeDasharray="6 6" />
      {/* ASK_USER lane — pauses before the shield */}
      <line x1="24" y1="226" x2="112" y2="226" stroke="#fbbf24" strokeOpacity="0.4" strokeWidth="1.6" strokeDasharray="6 6" />
    </g>

    {/* workload chips on each lane */}
    <g>
      {/* ALLOW chip mid-flight right of shield */}
      <g transform="translate(258 86)">
        <rect x="-24" y="-12" width="48" height="24" rx="7" fill="#0d3f3a" stroke="#34d399" strokeOpacity="0.8" strokeWidth="1.6" />
        <g stroke="#34d399" strokeOpacity="0.9" strokeWidth="1.4">
          <line x1="-15" y1="-4" x2="15" y2="-4" />
          <line x1="-15" y1="4" x2="6" y2="4" />
        </g>
      </g>
      {/* DENY chip bounced back */}
      <g transform="translate(88 152) rotate(-8)">
        <rect x="-24" y="-12" width="48" height="24" rx="7" fill="#0d3f3a" stroke="#fb7185" strokeOpacity="0.8" strokeWidth="1.6" />
        <g stroke="#fb7185" strokeOpacity="0.9" strokeWidth="1.4">
          <line x1="-15" y1="-4" x2="15" y2="-4" />
          <line x1="-15" y1="4" x2="6" y2="4" />
        </g>
      </g>
      {/* ASK_USER chip waiting with a pause badge */}
      <g transform="translate(92 226)">
        <rect x="-24" y="-12" width="48" height="24" rx="7" fill="#0d3f3a" stroke="#fbbf24" strokeOpacity="0.8" strokeWidth="1.6" />
        <g stroke="#fbbf24" strokeOpacity="0.9" strokeWidth="1.4">
          <line x1="-15" y1="-4" x2="15" y2="-4" />
          <line x1="-15" y1="4" x2="6" y2="4" />
        </g>
        <circle cx="30" cy="-14" r="8" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
        <g stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round">
          <line x1="27.5" y1="-18" x2="27.5" y2="-10" />
          <line x1="32.5" y1="-18" x2="32.5" y2="-10" />
        </g>
      </g>
    </g>
    {/* central shield gate */}
    <g>
      <path
        d="M180 66 L246 90 V152 C246 198 218 230 180 246 C142 230 114 198 114 152 V90 Z"
        fill="#0d3f3a"
        stroke="#5eead4"
        strokeOpacity="0.8"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M180 82 L232 101 V152 C232 190 210 217 180 231 C150 217 128 190 128 152 V101 Z"
        fill="#5eead4"
        fillOpacity="0.1"
        stroke="#5eead4"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* padlock emblem */}
      <g transform="translate(180 148)">
        <rect x="-19" y="-2" width="38" height="30" rx="7" fill="#072e2a" stroke="#5eead4" strokeOpacity="0.85" strokeWidth="2" />
        <path d="M-11 -2 V-12 A11 11 0 0 1 11 -12 V-2" fill="none" stroke="#5eead4" strokeOpacity="0.85" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="0" cy="11" r="4" fill="#34d399" />
        <line x1="0" y1="13" x2="0" y2="20" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" />
      </g>

      {/* verdict pip lights down the shield edge */}
      <g>
        <circle cx="180" cy="70" r="5" fill="#34d399" className="ga-node-live" />
        <circle cx="243" cy="120" r="4.5" fill="#fbbf24" fillOpacity="0.9" />
        <circle cx="117" cy="120" r="4.5" fill="#fb7185" fillOpacity="0.9" />
      </g>
    </g>

    {/* impact spark where DENY stops the chip */}
    <g stroke="#fb7185" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
      <line x1="116" y1="140" x2="124" y2="132" />
      <line x1="118" y1="152" x2="128" y2="152" />
      <line x1="116" y1="164" x2="124" y2="172" />
    </g>

    {/* check badge where ALLOW exits */}
    <g transform="translate(316 86)">
      <circle r="11" fill="#072e2a" stroke="#34d399" strokeWidth="1.8" />
      <path d="M-4.5 0 L-1 3.5 L5 -4" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* human approval icon for ASK_USER */}
    <g transform="translate(160 226)">
      <circle cx="0" cy="-9" r="5" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
      <path d="M-8 8 C-8 -1 -8 -1 0 -1 C8 -1 8 -1 8 8" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
    </g>
    <line x1="112" y1="226" x2="142" y2="226" stroke="#fbbf24" strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="3 5" />

    {/* floating leaves */}
    <g transform="translate(322 210) rotate(20)">
      <path d="M0 13 C-9 6 -9 -6 0 -11 C9 -6 9 6 0 13 Z" fill="#5eead4" fillOpacity="0.14" stroke="#5eead4" strokeOpacity="0.5" strokeWidth="1.4" />
      <path d="M0 13 L0 -8" stroke="#5eead4" strokeOpacity="0.4" strokeWidth="1.2" />
    </g>
    <g transform="translate(30 40) rotate(-16)">
      <path d="M0 10 C-7 4.5 -7 -4.5 0 -8.5 C7 -4.5 7 4.5 0 10 Z" fill="#5eead4" fillOpacity="0.1" stroke="#5eead4" strokeOpacity="0.4" strokeWidth="1.2" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* 6. Carbon timeline + workload deferral — Impact section             */
/* ------------------------------------------------------------------ */

export const ImpactGaugeIllustration: React.FC = () => (
  <svg
    viewBox="0 0 560 300"
    className="h-auto w-full"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="gaImpactFill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
        <stop offset="42%" stopColor="#fbbf24" stopOpacity="0.22" />
        <stop offset="60%" stopColor="#34d399" stopOpacity="0.26" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="gaImpactLine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="45%" stopColor="#fbbf24" />
        <stop offset="70%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* chart panel styled like a mini dashboard window */}
    <rect x="24" y="18" width="512" height="264" rx="20" fill="#ffffff" stroke="#10b981" strokeOpacity="0.35" strokeWidth="1.8" />
    <path d="M24 38 A20 20 0 0 1 44 18 L516 18 A20 20 0 0 1 536 38 L536 64 L24 64 Z" fill="#ecfdf5" />
    <line x1="24" y1="64" x2="536" y2="64" stroke="#10b981" strokeOpacity="0.3" strokeWidth="1.4" />
    <circle cx="46" cy="41" r="4" fill="#f87171" fillOpacity="0.75" />
    <circle cx="60" cy="41" r="4" fill="#fbbf24" fillOpacity="0.75" />
    <circle cx="74" cy="41" r="4" fill="#34d399" fillOpacity="0.75" />
    <rect x="94" y="36" width="106" height="10" rx="5" fill="#10b981" fillOpacity="0.28" />
    <rect x="208" y="36" width="64" height="10" rx="5" fill="#10b981" fillOpacity="0.12" />

    {/* gridlines + hour ticks */}
    <g stroke="#10b981" strokeOpacity="0.14" strokeWidth="1">
      {[104, 144, 184, 224].map((y) => (
        <line key={y} x1="56" y1={y} x2="504" y2={y} />
      ))}
    </g>
    <g fill="#64748b" fontSize="11" fontWeight="600" textAnchor="middle">
      {[
        { x: 84, t: '15:00' },
        { x: 169, t: '16:00' },
        { x: 254, t: '17:00' },
        { x: 339, t: '18:00' },
        { x: 424, t: '19:00' },
      ].map((h) => (
        <text key={h.t} x={h.x} y="270">{h.t}</text>
      ))}
    </g>
    <line x1="56" y1="250" x2="504" y2="250" stroke="#10b981" strokeOpacity="0.4" strokeWidth="1.6" strokeLinecap="round" />

    {/* clean-window highlight at 17:00 */}
    <rect x="212" y="88" width="90" height="162" rx="10" fill="#34d399" fillOpacity="0.12" />
    <line x1="212" y1="88" x2="212" y2="250" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="5 5" />
    <line x1="302" y1="88" x2="302" y2="250" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="5 5" />
    <rect x="222" y="94" width="70" height="18" rx="9" fill="#059669" fillOpacity="0.85" />
    <text x="257" y="107" fill="#ffffff" fontSize="9.5" fontWeight="800" letterSpacing="1" textAnchor="middle">CLEAN</text>

    {/* carbon intensity area + line: dirty peak easing into the clean dip */}
    <path
      d="M56 118 C 96 108, 128 96, 169 132 C 204 162, 226 216, 257 218 C 292 220, 314 186, 339 158 C 372 122, 400 128, 424 148 C 456 172, 482 168, 504 162 L504 250 L56 250 Z"
      fill="url(#gaImpactFill)"
    />
    <path
      className="ga-flow"
      d="M56 118 C 96 108, 128 96, 169 132 C 204 162, 226 216, 257 218 C 292 220, 314 186, 339 158 C 372 122, 400 128, 424 148 C 456 172, 482 168, 504 162"
      fill="none"
      stroke="url(#gaImpactLine)"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* dirty-peak + clean-trough markers */}
    <circle cx="112" cy="100" r="7" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="2" />
    <circle cx="257" cy="218" r="8" fill="#059669" fillOpacity="0.25" stroke="#059669" strokeWidth="2.2" className="ga-node-live" />
    {/* shrinking CO₂ cloud drifting away from the dirty peak */}
    <g fill="#94a3b8" fillOpacity="0.5">
      <circle cx="126" cy="76" r="7" />
      <circle cx="136" cy="70" r="10" />
      <circle cx="147" cy="76" r="7" />
      <rect x="124" y="74" width="25" height="9" rx="4.5" />
    </g>
    <text x="137" y="80" fill="#64748b" fontSize="8" fontWeight="800" textAnchor="middle">CO₂</text>

    {/* sprouting leaf at the clean end of the curve */}
    <g transform="translate(470 130)">
      <path d="M0 15 C-10 5 -10 -8 0 -14 C10 -8 10 5 0 15 Z" fill="#10b981" fillOpacity="0.22" stroke="#059669" strokeOpacity="0.7" strokeWidth="1.6" />
      <path d="M0 15 L0 -10" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.2" />
    </g>

    {/* workload chip deferring along a dashed trajectory into the clean window */}
    <rect x="118" y="140" width="54" height="24" rx="7" fill="#ffffff" stroke="#059669" strokeOpacity="0.7" strokeWidth="1.6" />
    <g stroke="#059669" strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round">
      <line x1="127" y1="148" x2="163" y2="148" />
      <line x1="127" y1="156" x2="153" y2="156" />
    </g>
    <path d="M174 162 C 196 176, 212 198, 236 208" fill="none" stroke="#059669" strokeOpacity="0.8" strokeWidth="1.9" strokeDasharray="5 5" strokeLinecap="round" />
    <path d="M236 208 L225 203 M236 208 L227 215" fill="none" stroke="#059669" strokeOpacity="0.8" strokeWidth="1.9" strokeLinecap="round" />

    {/* target chip landed in clean window */}
    <rect x="242" y="196" width="54" height="24" rx="7" fill="#34d399" fillOpacity="0.15" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.6" strokeDasharray="4 4" />
    <g stroke="#059669" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round">
      <line x1="251" y1="204" x2="287" y2="204" />
      <line x1="251" y1="212" x2="277" y2="212" />
    </g>

    {/* savings chips */}
    <g transform="translate(398 84)">
      <rect x="0" y="0" width="118" height="28" rx="14" fill="#ecfdf5" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M16 19 L22 9 L28 19 Z" fill="#10b981" fillOpacity="0.6" />
      <rect x="38" y="8" width="64" height="5" rx="2.5" fill="#059669" fillOpacity="0.55" />
      <rect x="38" y="17" width="44" height="5" rx="2.5" fill="#059669" fillOpacity="0.3" />
    </g>
    <g transform="translate(398 196)">
      <rect x="0" y="0" width="118" height="28" rx="14" fill="#ecfdf5" stroke="#059669" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="18" cy="14" r="8" fill="#10b981" fillOpacity="0.25" />
      <path d="M18 9 L18 19 M14 12.5 L18 8.5 L22 12.5" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="38" y="8" width="58" height="5" rx="2.5" fill="#059669" fillOpacity="0.55" />
      <rect x="38" y="17" width="40" height="5" rx="2.5" fill="#059669" fillOpacity="0.3" />
    </g>

  </svg>
);




