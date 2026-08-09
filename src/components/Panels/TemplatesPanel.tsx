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
  const filteredPresets = selectedPlatform === 'all'
    ? PLATFORM_PRESETS
    : PLATFORM_PRESETS.filter(p => p.platform === selectedPlatform);

  const handleResize = (preset: typeof PLATFORM_PRESETS[0]) => {
    if (preset.id === 'custom') return;
    dispatch({ type: 'SET_CANVAS', payload: { width: preset.width, height: preset.height } });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const { Image: FabricImage } = await import('fabric');

      // Load into HTML image for pixel analysis
      const img = await new Promise<HTMLImageElement>(r => {
        const i = new Image(); i.onload = () => r(i); i.src = dataUrl;
      });

      const fImg = new FabricImage(img, {
        left: Math.max(0, (doc.canvas.width - Math.min(img.width, doc.canvas.width * 0.8)) / 2),
        top: Math.max(0, (doc.canvas.height - Math.min(img.height, doc.canvas.height * 0.8)) / 2),
      });
      (fImg as any).data = { layerId: `import-${Date.now()}`, isSourceImage: true };

      if (img.width > doc.canvas.width * 0.8 || img.height > doc.canvas.height * 0.8) {
        fImg.scaleToWidth(doc.canvas.width * 0.8);
      }

      // store the HTMLImageElement on the fabric image for later segmentation
      (fImg as any)._htmlImageElement = img;

      canvas.add(fImg);
      canvas.setActiveObject(fImg);
      canvas.renderAll();

      const layerId = `import-${Date.now()}`;
      addLayer({
        name: file.name || 'Imported Image',
        type: 'raster', visible: true, locked: false,
        opacity: 1, blendMode: 'normal', isGroup: false,
        fabricObjectId: layerId,
      });
      saveSnapshot();
      setUploading(false);

      // If segmentation mode is on, auto-run segmentation
      if (segmentationMode) {
        setTimeout(async () => {
          await applyLayerSegmentation(canvas, addLayer, img);
          saveSnapshot();
        }, 300);
      }
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  }, [fabricRef, doc.canvas, addLayer, saveSnapshot, segmentationMode]);

  const handleSplitLayers = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setUploading(true);

    // Find the source image on canvas
    const images = canvas.getObjects().filter((o: any) =>
      o.type === 'image' && !o.data?.isBackground && !o.data?.isCheckerboard
    );

    if (images.length === 0) {
      // no image — use demo segmentation
      await applyLayerSegmentation(canvas, addLayer);
    } else {
      const mainImg = images[images.length - 1];
      const htmlImg = (mainImg as any)._htmlImageElement || null;
      await applyLayerSegmentation(canvas, addLayer, htmlImg);
    }

    saveSnapshot();
    setUploading(false);
  }, [fabricRef, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <h3>Templates & Upload</h3>
        <button onClick={() => setShowUpload(!showUpload)} style={{
          padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 10, fontWeight: 600,
          border: '1px solid var(--border-accent)',
          background: showUpload ? 'var(--accent)' : 'transparent',
          color: showUpload ? '#fff' : 'var(--accent)', cursor: 'pointer',
        }}>
          {showUpload ? 'Close' : 'Upload'}
        </button>
      </div>

      {/* Upload section */}
      {showUpload && (
        <div style={{ padding: '10px' }}>
          <div style={{
            padding: '16px', border: '2px dashed var(--border-default)', borderRadius: 'var(--radius-md)',
            textAlign: 'center', background: 'var(--bg-elevated)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📁</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {uploading ? '⏳ Processing...' : 'Drop image or click to upload'}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-disabled)', marginBottom: 10 }}>
              PSD · AI · SVG · PDF · JPG · PNG · WebP · GIF · TIFF · RAW · HEIC
            </div>

            {/* Auto-segment toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginBottom: 10, fontSize: 11, color: 'var(--text-muted)',
              cursor: 'pointer',
            }}>
              <input type="checkbox" checked={segmentationMode}
                onChange={e => setSegmentationMode(e.target.checked)} />
              🤖 Auto-split into layers on upload
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <label style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)', color: '#fff',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
                Browse Files
                <input type="file" accept={ACCEPTED} style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </label>
              <button onClick={() => {
                const c = document.createElement('canvas');
                c.width = 800; c.height = 600;
                const ctx = c.getContext('2d')!;
                const grad = ctx.createLinearGradient(0, 0, 800, 600);
                grad.addColorStop(0, '#ff6b6b'); grad.addColorStop(0.5, '#ffd93d'); grad.addColorStop(1, '#6c5ce7');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 600);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 36px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('DESIGN HERO', 400, 280);
                ctx.font = '18px Inter, system-ui, sans-serif';
                ctx.fillText('Tagline goes here — edit this layer', 400, 320);
                // draw a "panel" divider
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(400, 50); ctx.lineTo(400, 550); ctx.stroke();
                c.toBlob(blob => {
                  if (blob) {
                    const f = new File([blob], 'sample-design.png', { type: 'image/png' });
                    handleFileUpload(f);
                  }
                });
              }} style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-overlay)', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12,
              }}>
                🎨 Use Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Layers button — active when an image is on canvas */}
      <div style={{ padding: '0 10px', marginTop: 4 }}>
        <button onClick={handleSplitLayers}
          disabled={uploading}
          style={{
            width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-accent)',
            background: uploading ? 'var(--bg-overlay)' : 'var(--accent)',
            color: '#fff', cursor: uploading ? 'wait' : 'pointer',
            fontSize: 12, fontWeight: 600,
            opacity: uploading ? 0.6 : 1,
          }}>
          {uploading ? '⏳ Analyzing...' : '🧱 Split Image into Layers'}
        </button>
        <div style={{
          fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center',
          marginTop: 4, marginBottom: 6,
        }}>
          Pixel analysis → text · subject · background · panels
        </div>
      </div>

      {/* Platform filter */}
      <div style={{ padding: '4px 8px', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <button key={p} onClick={() => setSelectedPlatform(p)}
            style={{
              padding: '3px 8px', borderRadius: 12, fontSize: 10,
              border: selectedPlatform === p ? '1px solid var(--border-accent)' : '1px solid var(--border-default)',
              background: selectedPlatform === p ? 'var(--accent-glow)' : 'transparent',
              color: selectedPlatform === p ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}>
            {p === 'all' ? 'ALL' : p}
          </button>
        ))}
      </div>

      {/* Preset list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {filteredPresets.map(preset => {
          const isActive = doc.canvas.width === preset.width && doc.canvas.height === preset.height;
          return (
            <div key={preset.id} onClick={() => handleResize(preset)}
              style={{
                padding: '8px 10px', margin: '2px 0', borderRadius: 'var(--radius-sm)',
                border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                cursor: preset.id === 'custom' ? 'default' : 'pointer',
                opacity: preset.id === 'custom' ? 0.5 : 1,
              }}>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{preset.name}</span>
                {isActive && <span style={{ fontSize: 9, color: 'var(--accent)' }}>✓</span>}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                {preset.width} × {preset.height}{preset.safeZone ? ' · safe zones' : ''}
              </div>
              <div style={{
                marginTop: 4, width: '100%', height: 28, background: 'var(--bg-overlay)',
                borderRadius: 3, border: '1px solid var(--border-subtle)', position: 'relative',
              }}>
                <div style={{ position: 'absolute', inset: 3, border: '1px dashed var(--border-default)', borderRadius: 1 }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 8, color: 'var(--text-disabled)' }}>
                  {preset.width}:{preset.height}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Smart object + template save hint */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid var(--border-subtle)',
        fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center',
      }}>
        💡 Upload → AI auto-splits into editable layers
        <br />
        🧠 Original is saved as Smart Object
      </div>
    </div>
  );
}
