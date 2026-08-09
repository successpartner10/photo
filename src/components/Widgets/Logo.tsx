import React, { useMemo } from 'react';

let logoCounter = 0;

export default function Logo({ size = 28, showText = true }: { size?: number; showText?: boolean }) {
  const uid = useMemo(() => `l${++logoCounter}`, []);
  const g1 = `g1-${uid}`;
  const gf = `gf-${uid}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, userSelect: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id={g1} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7c3aed"/>
            <stop offset="40%" stopColor="#a78bfa"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
          <filter id={gf}>
            <feGaussianBlur stdDeviation="0.6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Handle */}
        <rect x="27" y="36" width="10" height="22" rx="4" fill={`url(#${g1})`} opacity="0.9" filter={`url(#${gf})`}/>
        <rect x="30" y="38" width="2" height="18" rx="1" fill="#fff" opacity="0.15"/>

        {/* Ferrule */}
        <rect x="24" y="32" width="16" height="6" rx="2" fill="#6b7280"/>
        <rect x="25" y="33" width="14" height="0.8" rx="0.4" fill="#9ca3af" opacity="0.4"/>
        <rect x="25" y="35" width="14" height="0.8" rx="0.4" fill="#9ca3af" opacity="0.3"/>

        {/* Bristles */}
        <path
          d="M24 32 C16 22 10 14 6 8 C10 12 16 14 20 16 C22 8 22 4 24 2 C24 8 26 14 30 18 C28 10 30 4 32 2 C33 8 34 14 34 18 C38 14 40 8 42 2 C43 4 43 8 44 16 C48 14 54 12 58 8 C54 14 48 22 40 32"
          fill={`url(#${g1})`} opacity="0.85" filter={`url(#${gf})`}
        />

        {/* Ink drops */}
        <path d="M29 42 Q32 48 35 42 Q32 46 29 42Z" fill="#a78bfa" opacity="0.9"/>
        <circle cx="32" cy="50" r="1.5" fill="#06b6d4" opacity="0.65"/>
        <circle cx="32" cy="54" r="1" fill="#06b6d4" opacity="0.4"/>
      </svg>

      {showText && (
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: size * 0.55, fontWeight: 800,
            letterSpacing: 1,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 40%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            ink
          </span>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: size * 0.55, fontWeight: 300,
            letterSpacing: 0.5, color: 'var(--text-secondary)',
          }}>
            ception
          </span>
        </div>
      )}
    </div>
  );
}
