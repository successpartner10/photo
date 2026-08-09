import React, { useState, useRef, useCallback } from 'react';
import { PLATFORM_PRESETS } from '../../data/presets';
import { useEditor } from '../../store/editorStore';
import { applyLayerSegmentation } from '../../ai/aiEffects';

const ACCEPTED = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif,.raw,.cr2,.nef,.arw';

export default function TemplatesPanel() {
  const { doc, dispatch, fabricRef, addLayer, saveSnapshot } = useEditor();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [segmentationMode, setSegmentationMode] = useState(false);

  const platforms = ['all', ...new Set(PLATFORM_PRESETS.map(p => p.platform))];
  const filteredPresets = selectedPlatform === 'all' ? PLATFORM_PRESETS : PLATFORM_PRESETS.filter(p => p.platform === selectedPlatform);

  const handleResize = (preset: typeof PLATFORM_PRESETS[0]) => {
    if (preset.id === 'custom') return;
    dispatch({ type: 'SET_CANVAS', payload: { width: preset.width, height: preset.height } });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const canvas = fabricRef.current; if (!canvas) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const { Image: FabricImage } = await import('fabric');
      const img = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = dataUrl; });
      const fImg = new FabricImage(img, {
        left: Math.max(0, (doc.canvas.width - Math.min(img.width, doc.canvas.width * 0.8)) / 2),
        top: Math.max(0, (doc.canvas.height - Math.min(img.height, doc.canvas.height * 0.8)) / 2),
      });
      (fImg as any).data = { layerId: `import-${Date.now()}`, isSourceImage: true };
      if (img.width > doc.canvas.width * 0.8 || img.height > doc.canvas.height * 0.8) fImg.scaleToWidth(doc.canvas.width * 0.8);
      (fImg as any)._htmlImageElement = img;
      canvas.add(fImg); canvas.setActiveObject(fImg); canvas.renderAll();
      addLayer({ name: file.name || 'File Import', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      saveSnapshot();
      setUploading(false);
      if (segmentationMode) setTimeout(async () => { await applyLayerSegmentation(canvas, addLayer, img); saveSnapshot(); }, 200);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  }, [fabricRef, doc.canvas, addLayer, saveSnapshot, segmentationMode]);

  const handleSplitLayers = useCallback(async () => {
    const canvas = fabricRef.current; if (!canvas) return; setUploading(true);
    const images = canvas.getObjects().filter((o: any) => o.type === 'image' && !o.data?.isBackground && !o.data?.isCheckerboard);
    const htmlImg = images.length > 0 ? (images[images.length - 1] as any)._htmlImageElement : null;
    await applyLayerSegmentation(canvas, addLayer, htmlImg);
    saveSnapshot(); setUploading(false);
  }, [fabricRef, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">RESIZE & UPLOAD</span>
        <button onClick={() => setShowUpload(!showUpload)} style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1, padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(124,92,252,0.3)', background: showUpload ? 'var(--accent)' : 'transparent', color: showUpload ? '#fff' : 'var(--accent)', cursor: 'pointer' }}>
          {showUpload ? 'CLOSE' : 'UPLOAD'}
        </button>
      </div>

      {showUpload && (
        <div style={{ padding: '10px' }}>
          <div style={{ padding: '16px', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--bg-elevated)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.5 }}>
              {uploading ? 'PROCESSING...' : 'DROP IMAGE OR CLICK'}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
              PSD · AI · SVG · PDF · JPG · PNG · WebP · GIF · TIFF · RAW · HEIC
            </div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, fontSize: 9, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              <input type="checkbox" checked={segmentationMode} onChange={e => setSegmentationMode(e.target.checked)} />
              AUTO-SPLIT INTO LAYERS
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <label style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 0.8 }}>
                BROWSE
                <input type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </label>
              <button onClick={() => {
                const c = document.createElement('canvas'); c.width = 800; c.height = 600; const ctx = c.getContext('2d')!;
                const grad = ctx.createLinearGradient(0, 0, 800, 600); grad.addColorStop(0, '#ff6b6b'); grad.addColorStop(0.5, '#ffd93d'); grad.addColorStop(1, '#6c5ce7');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 600);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('DESIGN HERO', 400, 280); ctx.font = '16px sans-serif'; ctx.fillText('tagline — edit this', 400, 320);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(400, 50); ctx.lineTo(400, 550); ctx.stroke();
                c.toBlob(blob => { if (blob) handleFileUpload(new File([blob], 'sample.png', { type: 'image/png' })); });
              }} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-overlay)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600, letterSpacing: 0.8 }}>
                SAMPLE
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '6px 10px' }}>
        <button onClick={handleSplitLayers} disabled={uploading} style={{
          width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(124,92,252,0.3)', background: uploading ? 'var(--bg-overlay)' : 'var(--accent)',
          color: '#fff', cursor: uploading ? 'wait' : 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, opacity: uploading ? 0.5 : 1,
        }}>{uploading ? 'ANALYZING...' : 'SPLIT INTO LAYERS'}</button>
        <div style={{ textAlign: 'center', margin: '4px 0', fontFamily: 'var(--font-body)', fontSize: 8, color: 'var(--text-disabled)' }}>
          Pixel analysis → text · subject · background · panels
        </div>
      </div>

      <div style={{ padding: '4px 8px', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <button key={p} onClick={() => setSelectedPlatform(p)} style={{
            padding: '3px 8px', borderRadius: 12, fontSize: 8, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 0.8,
            border: selectedPlatform === p ? '1px solid rgba(124,92,252,0.3)' : '1px solid var(--border-default)',
            background: selectedPlatform === p ? 'var(--accent-dim)' : 'transparent',
            color: selectedPlatform === p ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer',
          }}>{p === 'all' ? 'ALL' : p.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {filteredPresets.map(preset => {
          const isActive = doc.canvas.width === preset.width && doc.canvas.height === preset.height;
          return (
            <div key={preset.id} onClick={() => handleResize(preset)} style={{
              padding: '7px 10px', margin: '2px 0', borderRadius: 'var(--radius-sm)',
              border: isActive ? '1px solid rgba(124,92,252,0.3)' : '1px solid transparent',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              cursor: preset.id === 'custom' ? 'default' : 'pointer', opacity: preset.id === 'custom' ? 0.4 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600, color: 'var(--text-primary)' }}>
                <span>{preset.name}</span>
                {isActive && <span style={{ color: 'var(--accent)', fontWeight: 800 }}>ACTIVE</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>
                {preset.width} × {preset.height}{preset.safeZone ? ' · SAFE' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
