import React from 'react';
import { PLATFORM_PRESETS } from '../../data/presets';

interface Props {
  onStart: (width: number, height: number) => void;
  onClose: () => void;
}

const QUICK_STARTS = [
  { icon: '📱', label: 'Instagram Post', w: 1080, h: 1080 },
  { icon: '📖', label: 'Story / Reel', w: 1080, h: 1920 },
  { icon: '▶️', label: 'YouTube Thumbnail', w: 1280, h: 720 },
  { icon: '📊', label: 'Presentation (16:9)', w: 1920, h: 1080 },
  { icon: '🖼', label: 'Blank Canvas', w: 1200, h: 800 },
];

export default function WelcomeModal({ onStart, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1e1e1e', borderRadius: 16, padding: 32,
        border: '1px solid #333', maxWidth: 600, width: '90vw',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ fontSize: 48, fontWeight: 700, color: '#7C5CFC', letterSpacing: -2, marginBottom: 4 }}>
          DesignEditor
        </div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
          AI-Powered Design · Photopea's power, Canva's speed
        </div>

        {/* Quick starts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {QUICK_STARTS.map(qs => (
            <button key={qs.label} onClick={() => onStart(qs.w, qs.h)}
              style={{
                padding: '14px 10px', borderRadius: 10,
                border: '1px solid #333', background: '#252525',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.border = '1px solid #7C5CFC'; (e.target as HTMLElement).style.background = '#2a2a2a'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.border = '1px solid #333'; (e.target as HTMLElement).style.background = '#252525'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{qs.icon}</div>
              <div style={{ fontSize: 11, color: '#ccc', fontWeight: 500 }}>{qs.label}</div>
              <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{qs.w}×{qs.h}</div>
            </button>
          ))}
        </div>

        {/* Features cheat sheet */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
          marginBottom: 16, fontSize: 11, color: '#666',
        }}>
          <span>🖼 Import: PSD·AI·SVG·PNG·JPG·GIF</span>
          <span>|</span>
          <span>✏️ Draw & Edit</span>
          <span>|</span>
          <span>✨ AI Tools</span>
          <span>|</span>
          <span>📤 Batch Export</span>
        </div>

        {/* Keyboard shortcuts */}
        <div style={{
          padding: '12px 16px', background: '#111', borderRadius: 8,
          marginBottom: 16, textAlign: 'left',
        }}>
          <div style={{ fontSize: 11, color: '#777', marginBottom: 8, textTransform: 'uppercase' }}>⌨ Keyboard Shortcuts</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {[
              ['V', 'Select'], ['R', 'Rectangle'], ['T', 'Text'],
              ['P', 'Pen'], ['B', 'Brush'], ['G', 'Fill'],
              ['Ctrl+Z', 'Undo'], ['Ctrl+S', 'Save'], ['Del', 'Delete'],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#7C5CFC', fontFamily: 'monospace', fontWeight: 600, minWidth: 50 }}>{key}</span>
                <span style={{ color: '#999' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onClose} style={{
          padding: '8px 24px', borderRadius: 8, border: 'none',
          background: '#444', color: '#aaa', cursor: 'pointer', fontSize: 12,
        }}>
          Close & Continue Editing
        </button>
      </div>
    </div>
  );
}
