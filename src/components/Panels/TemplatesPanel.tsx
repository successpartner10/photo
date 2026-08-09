import React, { useState, useCallback } from 'react';
import { PLATFORM_PRESETS } from '../../data/presets';
import { useEditor } from '../../store/editorStore';
import { applyLayerSegmentation } from '../../ai/aiEffects';

const ACCEPTED = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';

export default function TemplatesPanel() {
  const { doc, dispatch, fabricRef, addLayer, saveSnapshot } = useEditor();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [autoSplit, setAutoSplit] = useState(false);

  const platforms = ['all', ...new Set(PLATFORM_PRESETS.map(p => p.platform))];
  const filtered = selectedPlatform === 'all' ? PLATFORM_PRESETS : PLATFORM_PRESETS.filter(p => p.platform === selectedPlatform);

  const handleResize = (preset: typeof PLATFORM_PRESETS[0]) => {
    if (preset.id === 'custom') return;
    dispatch({ type: 'SET_CANVAS', payload: { width: preset.width, height: preset.height } });
  };

  const handleUpload = useCallback(async (file: File) => {
    const canvas = fabricRef.current; if (!canvas) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const { Image: FabricImage } = await import('fabric');
      const img = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = dataUrl; });
      const scale = Math.min((doc.canvas.width * 0.88) / img.width, (doc.canvas.height * 0.88) / img.height, 1);
      const fImg = new FabricImage(img, {
        left: (doc.canvas.width - img.width * scale) / 2,
        top: (doc.canvas.height - img.height * scale) / 2,
        scaleX: scale, scaleY: scale,
      });
      (fImg as any).data = { layerId: `import-${Date.now()}`, isSourceImage: true };
      (fImg as any)._htmlImageElement = img;
      canvas.add(fImg); canvas.setActiveObject(fImg); canvas.renderAll();
      addLayer({ name: file.name || 'Import', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      saveSnapshot();
      if (autoSplit) {
        setTimeout(async () => { await applyLayerSegmentation(canvas, addLayer, img); saveSnapshot(); }, 300);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, [fabricRef, doc.canvas, addLayer, saveSnapshot, autoSplit]);

  const handleSplit = useCallback(async () => {
    const canvas = fabricRef.current; if (!canvas) return;
    setUploading(true);
    const images = canvas.getObjects().filter((o: any) => o.type === 'image' && !o.data?.isBackground && !o.data?.isCheckerboard);
    const htmlImg = images.length > 0 ? (images[images.length - 1] as any)._htmlImageElement : null;
    await applyLayerSegmentation(canvas, addLayer, htmlImg);
    saveSnapshot(); setUploading(false);
  }, [fabricRef, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ps-panel)' }}>
      {/* Upload area */}
      <div style={{ padding: '8px', borderBottom: '1px solid #222' }}>
        <label style={{ display: 'block', width: '100%', padding: '16px', border: '2px dashed #444', background: 'var(--ps-input)', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: 'var(--ps-text-dim)', marginBottom: 4 }}>{uploading ? 'Importing...' : 'Click to upload image'}</div>
          <div style={{ fontSize: 9, color: 'var(--ps-text-muted)' }}>PSD · AI · SVG · JPG · PNG · WebP · GIF · TIFF</div>
          <input type="file" accept={ACCEPTED} style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 10, color: 'var(--ps-text-dim)', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoSplit} onChange={e => setAutoSplit(e.target.checked)} />
          Auto-split into layers on upload
        </label>

        <button onClick={handleSplit} disabled={uploading}
          className="ps-btn ps-btn-accent" style={{ width: '100%', marginTop: 6, padding: '6px' }}>
          Split Image into Layers
        </button>
      </div>

      {/* Platform filter */}
      <div style={{ padding: '4px 6px', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <button key={p} onClick={() => setSelectedPlatform(p)}
            style={{
              padding: '2px 6px', fontSize: 9, cursor: 'pointer',
              background: selectedPlatform === p ? 'var(--ps-accent)' : 'transparent',
              border: selectedPlatform === p ? '1px solid var(--ps-accent)' : '1px solid transparent',
              color: selectedPlatform === p ? '#fff' : 'var(--ps-text-dim)',
            }}>{p === 'all' ? 'ALL' : p}</button>
        ))}
      </div>

      {/* Presets */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px' }}>
        {filtered.map(p => {
          const active = doc.canvas.width === p.width && doc.canvas.height === p.height;
          return (
            <div key={p.id} onClick={() => handleResize(p)}
              style={{
                padding: '5px 8px', cursor: p.id === 'custom' ? 'default' : 'pointer',
                background: active ? 'var(--ps-accent)' : 'transparent',
                borderBottom: '1px solid #222', opacity: p.id === 'custom' ? 0.4 : 1,
              }}>
              <div style={{ fontSize: 10, color: active ? '#fff' : 'var(--ps-text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.name}</span>
                {active && <span style={{ fontSize: 9 }}>✓</span>}
              </div>
              <div style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.6)' : 'var(--ps-text-muted)' }}>
                {p.width} × {p.height}{p.safeZone ? ' · safe' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
