import React from 'react';
import Logo from './Logo';

interface Props {
  onStart: (width: number, height: number) => void;
  onClose: () => void;
}

const QUICK_STARTS = [
  { label: 'Story / Reel', w: 1080, h: 1920 },
  { label: 'Instagram Post', w: 1080, h: 1080 },
  { label: 'YouTube Thumb', w: 1280, h: 720 },
  { label: 'Presentation', w: 1920, h: 1080 },
  { label: 'Blank Canvas', w: 1200, h: 800 },
];

export default function WelcomeModal({ onStart, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
        padding: '40px 36px', border: '1px solid var(--border-default)',
        maxWidth: 560, width: '90vw', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Logo size={48} showText={false} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <Logo size={28} showText={true} />
        </div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
          color: 'var(--text-muted)', marginBottom: 28,
        }}>
          Design with natural language, not menus. AI does the heavy lifting.
        </div>

        {/* Quick starts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
          {QUICK_STARTS.map(qs => (
            <button key={qs.label} onClick={() => onStart(qs.w, qs.h)}
              style={{
                padding: '16px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-overlay)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.5 }}>
                {qs.label}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text-disabled)', marginTop: 2 }}>
                {qs.w} × {qs.h}
              </div>
            </button>
          ))}
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
          marginBottom: 20, fontSize: 9, color: 'var(--text-disabled)',
          fontFamily: 'var(--font-body)', fontWeight: 500,
        }}>
          <span>Import: PSD · AI · SVG · JPG · PNG · WebP</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span>Draw · Edit · Layers</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ color: 'var(--accent)' }}>✦ AI Powered</span>
        </div>

        <div style={{
          padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
          marginBottom: 18, textAlign: 'left',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-disabled)', marginBottom: 8 }}>
            KEYBOARD SHORTCUTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px' }}>
            {[['V', 'Select'], ['R', 'Rectangle'], ['T', 'Text'], ['P', 'Pen'], ['B', 'Brush'], ['Ctrl+Z', 'Undo'], ['Ctrl+S', 'Save'], ['Del', 'Delete']].map(([k, d]) => (
              <div key={k} style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'var(--font-body)' }}>
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, minWidth: 50, fontSize: 9 }}>{k}</span>
                <span style={{ color: 'var(--text-muted)' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="btn"
          style={{ padding: '8px 28px', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
          START CREATING
        </button>
      </div>
    </div>
  );
}
