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

  const handleCopy = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.getElement().toBlob((blob: Blob | null) => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).catch(() => {});
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ps-panel)' }}>
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: 'var(--ps-text-muted)' }}>
          Canvas: {doc.canvas.width} × {doc.canvas.height} px
        </div>

        {!batchMode ? (
          <>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ps-text-muted)', marginBottom: 3 }}>Format</div>
              <select value={format} onChange={e => setFormat(e.target.value as ExportFormat)}
                style={{ width: '100%', fontSize: 10, padding: '4px 6px', background: 'var(--ps-input)', border: '1px solid #333', color: 'var(--ps-text)' }}>
                {EXPORT_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label} ({f.ext})</option>)}
              </select>
            </div>

            {(format === 'jpg' || format === 'webp') && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--ps-text-muted)', marginBottom: 3 }}>Quality: {quality}%</div>
                <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} style={{ width: '100%' }} />
              </div>
            )}

            {format !== 'svg' && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--ps-text-muted)', marginBottom: 3 }}>Resolution</div>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[72, 150, 300].map(d => (
                    <button key={d} onClick={() => setDpi(d)}
                      style={{
                        flex: 1, padding: '5px', fontSize: 10,
                        background: dpi === d ? 'var(--ps-accent)' : 'var(--ps-input)',
                        border: dpi === d ? '1px solid var(--ps-accent)' : '1px solid #333',
                        color: dpi === d ? '#fff' : 'var(--ps-text-dim)', cursor: 'pointer',
                      }}>{d} DPI</button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleExport} disabled={exporting} className="ps-btn ps-btn-accent" style={{ width: '100%', padding: '8px' }}>
              {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </button>

            <div style={{ display: 'flex', gap: 3 }}>
              <button onClick={handleCopy} className="ps-btn" style={{ flex: 1, fontSize: 10 }}>Copy</button>
              <button onClick={() => { setFormat('png'); handleExport(); }} className="ps-btn" style={{ flex: 1, fontSize: 10 }}>Quick PNG</button>
              <button onClick={() => setBatchMode(true)} className="ps-btn" style={{ flex: 1, fontSize: 10 }}>Batch</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, color: 'var(--ps-text-dim)' }}>Select platform sizes to batch export:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {PLATFORM_PRESETS.filter(p => p.id !== 'custom').map(p => (
                <button key={p.id}
                  onClick={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  style={{
                    padding: '4px 8px', fontSize: 9,
                    background: selectedPlatforms.includes(p.id) ? 'var(--ps-accent)' : 'var(--ps-input)',
                    border: selectedPlatforms.includes(p.id) ? '1px solid var(--ps-accent)' : '1px solid #333',
                    color: selectedPlatforms.includes(p.id) ? '#fff' : 'var(--ps-text-dim)', cursor: 'pointer',
                  }}>{p.platform}</button>
              ))}
            </div>
            <button onClick={handleBatchExport} disabled={selectedPlatforms.length === 0 || exporting}
              className="ps-btn ps-btn-accent" style={{ width: '100%', padding: '8px' }}>
              {exporting ? 'Exporting...' : `Export ${selectedPlatforms.length} sizes`}
            </button>
            <button onClick={() => setBatchMode(false)} className="ps-btn" style={{ width: '100%', fontSize: 10 }}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}
