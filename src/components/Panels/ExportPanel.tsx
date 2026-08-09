import React, { useState } from 'react';
import { useEditor } from '../../store/editorStore';
import { EXPORT_FORMATS, PLATFORM_PRESETS } from '../../data/presets';
import { ExportFormat } from '../../types/editor';

export default function ExportPanel() {
  const { doc, fabricRef } = useEditor();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [dpi, setDpi] = useState(72);
  const [exporting, setExporting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const handleExport = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    setExporting(true);
    const a = document.createElement('a');
    if (format === 'svg') {
      a.href = URL.createObjectURL(new Blob([canvas.toSVG()], { type: 'image/svg+xml' }));
    } else {
      a.href = canvas.toDataURL({ format: format === 'jpg' ? 'jpeg' : format, quality: quality / 100, multiplier: dpi / 72 });
    }
    a.download = `${doc.name || 'export'}.${format}`;
    a.click();
    setTimeout(() => setExporting(false), 600);
  };

  const handleBatchExport = () => {
    const canvas = fabricRef.current; if (!canvas || selectedPlatforms.length === 0) return;
    setExporting(true);
    setTimeout(() => {
      selectedPlatforms.forEach(pid => {
        const preset = PLATFORM_PRESETS.find(p => p.id === pid); if (!preset) return;
        const a = document.createElement('a');
        a.href = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1, width: preset.width, height: preset.height });
        a.download = `${doc.name}_${preset.platform}_${preset.width}x${preset.height}.png`;
        a.click();
      });
      setExporting(false);
    }, 200);
  };

  const handleCopyToClipboard = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.getElement().toBlob((blob: Blob | null) => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">EXPORT</span>
        <button onClick={() => setBatchMode(!batchMode)} style={{
          fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1.2,
          padding: '3px 8px', borderRadius: 'var(--radius-sm)',
          border: batchMode ? '1px solid rgba(124,92,252,0.3)' : '1px solid var(--border-default)',
          background: batchMode ? 'var(--accent-dim)' : 'transparent',
          color: batchMode ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
        }}>{batchMode ? 'SINGLE' : 'BATCH'}</button>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        <div style={{ padding: 8, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, color: 'var(--text-muted)' }}>
          CANVAS: {doc.canvas.width} × {doc.canvas.height}
        </div>

        {!batchMode ? (
          <>
            <Field label="FORMAT">
              <select value={format} onChange={e => setFormat(e.target.value as ExportFormat)} style={{ width: '100%', padding: '7px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {EXPORT_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </Field>
            {(format === 'jpg' || format === 'webp') && (
              <Field label={`QUALITY: ${quality}%`}>
                <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} style={{ width: '100%' }} />
              </Field>
            )}
            {format !== 'svg' && (
              <Field label="DPI">
                <div style={{ display: 'flex', gap: 5 }}>
                  {[72, 150, 300].map(d => (
                    <button key={d} onClick={() => setDpi(d)} style={{
                      flex: 1, padding: '6px', borderRadius: 'var(--radius-sm)',
                      border: dpi === d ? '1px solid rgba(124,92,252,0.3)' : '1px solid var(--border-default)',
                      background: dpi === d ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                      color: dpi === d ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
                    }}>{d}</button>
                  ))}
                </div>
              </Field>
            )}
            <button onClick={handleExport} disabled={exporting} style={{
              width: '100%', padding: '11px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: exporting ? 'var(--bg-overlay)' : 'var(--accent)',
              color: '#fff', cursor: exporting ? 'default' : 'pointer',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
            }}>{exporting ? 'EXPORTING...' : `EXPORT ${format.toUpperCase()}`}</button>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleCopyToClipboard} style={quickBtn}>COPY</button>
              <button onClick={() => { setFormat('png'); handleExport(); }} style={quickBtn}>QUICK PNG</button>
              <button onClick={() => { setFormat('jpg'); handleExport(); }} style={quickBtn}>QUICK JPG</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5 }}>
              BATCH EXPORT — SELECT SIZES:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {PLATFORM_PRESETS.filter(p => p.id !== 'custom').map(p => (
                <button key={p.id} onClick={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  style={{
                    padding: '5px 8px', borderRadius: 'var(--radius-sm)', fontSize: 8, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 0.8,
                    border: selectedPlatforms.includes(p.id) ? '1px solid rgba(124,92,252,0.3)' : '1px solid var(--border-default)',
                    background: selectedPlatforms.includes(p.id) ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    color: selectedPlatforms.includes(p.id) ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
                  }}>{p.platform} {p.width}×{p.height}</button>
              ))}
            </div>
            <button onClick={handleBatchExport} disabled={selectedPlatforms.length === 0 || exporting} style={{
              width: '100%', padding: '11px', borderRadius: 'var(--radius-sm)',
              border: 'none', background: selectedPlatforms.length > 0 && !exporting ? 'var(--accent)' : 'var(--bg-overlay)',
              color: selectedPlatforms.length > 0 && !exporting ? '#fff' : 'var(--text-disabled)',
              cursor: selectedPlatforms.length > 0 && !exporting ? 'pointer' : 'default',
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
            }}>{exporting ? 'EXPORTING...' : `EXPORT ${selectedPlatforms.length} SIZES`}</button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800, letterSpacing: 1.2, color: 'var(--text-disabled)' }}>{label}</span>
      {children}
    </div>
  );
}
const quickBtn: React.CSSProperties = {
  flex: 1, padding: '6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer',
  fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: 1,
};
