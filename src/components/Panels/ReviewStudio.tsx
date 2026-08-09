import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor } from '../../store/editorStore';

export default function ReviewStudio() {
  const { doc, fabricRef } = useEditor();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<'desktop' | 'mobile' | 'grid' | 'compare'>('desktop');
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    setPreviewUrl(c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }));
  }, [fabricRef]);

  useEffect(() => { refresh(); const i = setInterval(refresh, 2000); return () => clearInterval(i); }, [refresh]);

  const deviceFrames = {
    desktop: { w: '100%', h: 'auto', label: 'DESKTOP' },
    mobile: { w: '45%', h: 'auto', label: 'MOBILE' },
    grid: { w: '100%', h: 'auto', label: 'GRID' },
    compare: { w: '100%', h: 'auto', label: 'COMPARE' },
  };

  const frame = deviceFrames[mode];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">REVIEW STUDIO</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, color: 'var(--text-disabled)' }}>
          {doc.canvas.width}×{doc.canvas.height}
        </span>
      </div>

      {/* Mode selector */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 3 }}>
        {(['desktop', 'mobile', 'grid', 'compare'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: '6px 4px', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, letterSpacing: 1.2,
            border: mode === m ? '1px solid var(--accent)' : '1px solid var(--border-default)',
            background: mode === m ? 'rgba(124,92,252,0.08)' : 'transparent',
            color: mode === m ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
          }}>{m.toUpperCase()}</button>
        ))}
      </div>

      {/* Preview area */}
      <div ref={containerRef} style={{
        flex: 1, overflow: 'auto', padding: '14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: `
          linear-gradient(45deg, var(--bg-elevated) 25%, transparent 25%),
          linear-gradient(-45deg, var(--bg-elevated) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, var(--bg-elevated) 75%),
          linear-gradient(-45deg, transparent 75%, var(--bg-elevated) 75%)
        `,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
      }}>
        {previewUrl ? (
          <div style={{
            border: '1px solid var(--border-default)',
            borderRadius: mode === 'mobile' ? '16px' : 'var(--radius)',
            overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            maxWidth: mode === 'mobile' ? '200px' : '100%',
          }}>
            <img src={previewUrl} alt="Preview" style={{
              width: '100%', height: 'auto', display: 'block',
            }} />
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--text-disabled)' }}>No content</div>
        )}

        {/* Grid overlay for grid mode */}
        {mode === 'grid' && (
          <div style={{
            fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--text-muted)',
            padding: 8, textAlign: 'center',
          }}>
            Grid: {doc.canvas.width}px ÷ 3 = {Math.round(doc.canvas.width / 3)}px columns
            <br />
            {doc.canvas.width}px ÷ 2 = {Math.round(doc.canvas.width / 2)}px split
          </div>
        )}

        {/* Compare mode - side by side */}
        {mode === 'compare' && previewUrl && (
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <div style={{ flex: 1, border: '1px solid rgba(255,107,107,0.3)', borderRadius: 'var(--radius)', overflow: 'hidden', opacity: 0.6 }}>
              <img src={previewUrl} alt="Before" style={{ width: '100%', display: 'block' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, textAlign: 'center', padding: 4, color: 'var(--accent2)', letterSpacing: 1 }}>BEFORE</div>
            </div>
            <div style={{ flex: 1, border: '1px solid rgba(78,205,196,0.3)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <img src={previewUrl} alt="After" style={{ width: '100%', display: 'block' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, textAlign: 'center', padding: 4, color: 'var(--accent3)', letterSpacing: 1 }}>AFTER</div>
            </div>
          </div>
        )}
      </div>

      {/* Zoom + refresh controls */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => setZoom(z => Math.max(25, z - 25))} style={{ padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700 }}>−</button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(400, z + 25))} style={{ padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700 }}>+</button>
        <div style={{ flex: 1 }} />
        <button onClick={refresh} style={{
          padding: '5px 10px', borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1,
          border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>⟳ REFRESH</button>
      </div>
    </div>
  );
}
