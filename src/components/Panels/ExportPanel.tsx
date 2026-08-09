import React, { useState, useCallback } from 'react';
import { useEditor } from '../../store/editorStore';
import { EXPORT_FORMATS, PLATFORM_PRESETS } from '../../data/presets';
import { ExportFormat } from '../../types/editor';

export default function ExportPanel() {
  const { doc, exportCanvas, fabricRef } = useEditor();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(90);
  const [transparency, setTransparency] = useState(true);
  const [dpi, setDpi] = useState(72);
  const [exporting, setExporting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [exportLayer, setExportLayer] = useState<string>('all');

  const formatInfo = EXPORT_FORMATS.find(f => f.id === format);

  const handleExport = useCallback(() => {
    setExporting(true);
    const link = document.createElement('a');
    const canvas = fabricRef.current;
    if (!canvas) { setExporting(false); return; }

    if (format === 'svg') {
      const svg = canvas.toSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      link.href = URL.createObjectURL(blob);
    } else {
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp',
        gif: 'image/gif', tiff: 'image/tiff',
      };
      const dataURL = canvas.toDataURL({
        format: format === 'jpg' ? 'jpeg' : format,
        quality: quality / 100,
        multiplier: dpi / 72,
      });
      link.href = dataURL;
    }
    link.download = `${doc.name || 'export'}.${format}`;
    link.click();
    setTimeout(() => setExporting(false), 800);
  }, [format, quality, dpi, doc.name, fabricRef]);

  const handleBatchExport = useCallback(() => {
    setExporting(true);
    const canvas = fabricRef.current;
    if (!canvas || selectedPlatforms.length === 0) { setExporting(false); return; }

    // For demo: export each selected platform size as PNG
    setTimeout(() => {
      selectedPlatforms.forEach(pid => {
        const preset = PLATFORM_PRESETS.find(p => p.id === pid);
        if (!preset) return;
        const dataURL = canvas.toDataURL({
          format: 'png', quality: 1, multiplier: 1,
          width: preset.width, height: preset.height,
        });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${doc.name}_${preset.platform}_${preset.width}x${preset.height}.png`;
        link.click();
      });
      setExporting(false);
    }, 300);
  }, [selectedPlatforms, doc.name, fabricRef]);

  const handleCopyToClipboard = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getElement().toBlob((blob: Blob | null) => {
      if (!blob) return;
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).catch(() => {});
    });
  }, [fabricRef]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1 }}>
          Export
        </span>
        <button onClick={() => setBatchMode(!batchMode)} style={{
          padding: '3px 10px', borderRadius: 4, fontSize: 10,
          border: batchMode ? '1px solid #7C5CFC' : '1px solid #444',
          background: batchMode ? '#7C5CFC22' : 'transparent',
          color: batchMode ? '#7C5CFC' : '#888', cursor: 'pointer',
        }}>
          {batchMode ? 'Single' : 'Batch'}
        </button>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {/* Canvas info */}
        <div style={{ padding: 8, background: '#1a1a1a', borderRadius: 6, fontSize: 11, color: '#888' }}>
          Canvas: {doc.canvas.width} × {doc.canvas.height} px
        </div>

        {!batchMode ? (
          <>
            <Field label="Format">
              <select value={format} onChange={e => setFormat(e.target.value as ExportFormat)} style={selectStyle}>
                {EXPORT_FORMATS.map(f => <option key={f.id} value={f.id}>{f.label} ({f.ext})</option>)}
              </select>
            </Field>

            {(format === 'jpg' || format === 'webp') && (
              <Field label={`Quality — ${quality}%`}>
                <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)}
                  style={{ width: '100%', accentColor: '#7C5CFC' }} />
              </Field>
            )}

            {formatInfo?.alpha && (
              <Field label="Transparency">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#bbb', cursor: 'pointer' }}>
                  <input type="checkbox" checked={transparency} onChange={e => setTransparency(e.target.checked)} />
                  Include transparency
                </label>
              </Field>
            )}

            {format !== 'svg' && (
              <Field label="DPI">
                <div style={{ display: 'flex', gap: 6 }}>
                  {[72, 150, 300].map(d => (
                    <button key={d} onClick={() => setDpi(d)} style={{
                      flex: 1, padding: '6px', borderRadius: 4,
                      border: dpi === d ? '1px solid #7C5CFC' : '1px solid #333',
                      background: dpi === d ? '#7C5CFC22' : '#1a1a1a',
                      color: dpi === d ? '#fff' : '#888', cursor: 'pointer', fontSize: 11,
                    }}>{d}</button>
                  ))}
                </div>
              </Field>
            )}

            {/* Selective export */}
            <Field label="Export scope">
              <select value={exportLayer} onChange={e => setExportLayer(e.target.value)} style={selectStyle}>
                <option value="all">Entire canvas</option>
                <option value="selection">Selected layers only</option>
                <option value="artboard">Visible artboard</option>
              </select>
            </Field>

            <button onClick={handleExport} disabled={exporting}
              style={{
                marginTop: 4, width: '100%', padding: '12px', borderRadius: 8,
                border: 'none', background: exporting ? '#444' : '#4CAF50',
                color: '#fff', cursor: exporting ? 'default' : 'pointer',
                fontSize: 13, fontWeight: 600,
              }}>
              {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
            </button>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleCopyToClipboard} style={quickBtn}>📋 Copy</button>
              <button onClick={() => { setFormat('png'); handleExport(); }} style={quickBtn}>🖼 Quick PNG</button>
              <button onClick={() => { setFormat('jpg'); handleExport(); }} style={quickBtn}>📸 Quick JPG</button>
            </div>
          </>
        ) : (
          /* Batch export mode */
          <>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
              Select platform sizes to batch export:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {PLATFORM_PRESETS.filter(p => p.id !== 'custom').map(p => (
                <button key={p.id} onClick={() => {
                  setSelectedPlatforms(prev =>
                    prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                  );
                }} style={{
                  padding: '5px 8px', borderRadius: 4, fontSize: 10,
                  border: selectedPlatforms.includes(p.id) ? '1px solid #7C5CFC' : '1px solid #444',
                  background: selectedPlatforms.includes(p.id) ? '#7C5CFC22' : 'transparent',
                  color: selectedPlatforms.includes(p.id) ? '#7C5CFC' : '#888',
                  cursor: 'pointer',
                }}>
                  {p.platform} {p.width}×{p.height}
                </button>
              ))}
            </div>
            <button onClick={handleBatchExport} disabled={selectedPlatforms.length === 0 || exporting}
              style={{
                marginTop: 8, width: '100%', padding: '12px', borderRadius: 8,
                border: 'none', background: selectedPlatforms.length > 0 && !exporting ? '#7C5CFC' : '#333',
                color: selectedPlatforms.length > 0 && !exporting ? '#fff' : '#666',
                cursor: selectedPlatforms.length > 0 && !exporting ? 'pointer' : 'default',
                fontSize: 13, fontWeight: 600,
              }}>
              {exporting ? 'Exporting...' : `Batch Export (${selectedPlatforms.length} sizes)`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      {children}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 6, border: '1px solid #333',
  background: '#1a1a1a', color: '#ccc', fontSize: 12, outline: 'none',
  width: '100%', boxSizing: 'border-box', cursor: 'pointer',
};
const quickBtn: React.CSSProperties = {
  flex: 1, padding: '6px', borderRadius: 4, border: '1px solid #333',
  background: '#1a1a1a', color: '#aaa', cursor: 'pointer', fontSize: 10,
};
