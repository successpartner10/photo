import React, { useState, useRef, useCallback } from 'react';
import { PLATFORM_PRESETS } from '../../data/presets';
import { useEditor } from '../../store/editorStore';

const ACCEPTED = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif,.raw,.cr2,.nef,.arw';

export default function TemplatesPanel() {
  const { doc, dispatch, fabricRef, addLayer, saveSnapshot } = useEditor();
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const img = await new Promise<HTMLImageElement>(r => {
        const i = new Image(); i.onload = () => r(i); i.src = dataUrl;
      });

      const fImg = new FabricImage(img, {
        left: Math.max(0, (doc.canvas.width - Math.min(img.width, doc.canvas.width * 0.8)) / 2),
        top: Math.max(0, (doc.canvas.height - Math.min(img.height, doc.canvas.height * 0.8)) / 2),
      });

      if (img.width > doc.canvas.width * 0.8 || img.height > doc.canvas.height * 0.8) {
        fImg.scaleToWidth(doc.canvas.width * 0.8);
      }

      canvas.add(fImg);
      canvas.setActiveObject(fImg);
      canvas.renderAll();

      addLayer({
        name: file.name || 'Imported Image',
        type: 'raster', visible: true, locked: false,
        opacity: 1, blendMode: 'normal', isGroup: false,
        fabricObjectId: `import-${Date.now()}`,
      });
      saveSnapshot();
      setUploading(false);
      setShowUpload(false);
    };
    reader.readAsDataURL(file);
  }, [fabricRef, doc.canvas, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1 }}>
          Templates
        </span>
        <button onClick={() => setShowUpload(!showUpload)} style={{
          padding: '4px 10px', borderRadius: 4, fontSize: 10,
          border: '1px solid #7C5CFC',
          background: showUpload ? '#7C5CFC' : 'transparent',
          color: showUpload ? '#fff' : '#7C5CFC', cursor: 'pointer',
        }}>
          {showUpload ? 'Close' : 'Upload'}
        </button>
      </div>

      {/* Upload section */}
      {showUpload && (
        <div style={{ margin: '8px', padding: '16px', border: '2px dashed #444', borderRadius: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📁</div>
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>
            {uploading ? 'Importing...' : 'Drop image or click to upload'}
          </div>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 8 }}>
            PSD · AI · SVG · PDF · JPG · PNG · WebP · GIF · TIFF · RAW · HEIC
          </div>
          <input ref={fileInputRef} type="file" accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <label style={{
              padding: '8px 16px', borderRadius: 6, background: '#7C5CFC',
              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              Browse Files
              <input type="file" accept={ACCEPTED} style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
            </label>
            <button onClick={() => {
              // Demo: create a sample gradient image
              const canvas = document.createElement('canvas');
              canvas.width = 800; canvas.height = 600;
              const ctx = canvas.getContext('2d')!;
              const grad = ctx.createLinearGradient(0, 0, 800, 600);
              grad.addColorStop(0, '#ff6b6b'); grad.addColorStop(0.5, '#ffd93d'); grad.addColorStop(1, '#6c5ce7');
              ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 600);
              ctx.fillStyle = '#fff'; ctx.font = 'bold 36px Inter, sans-serif';
              ctx.textAlign = 'center'; ctx.fillText('Sample Background', 400, 300);
              canvas.toBlob(blob => {
                if (blob) {
                  const f = new File([blob], 'sample-bg.png', { type: 'image/png' });
                  handleFileUpload(f);
                }
              });
            }} style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid #444',
              background: '#2a2a2a', color: '#aaa', cursor: 'pointer', fontSize: 12,
            }}>
              🎨 Use Sample
            </button>
          </div>
        </div>
      )}

      {/* Platform filter */}
      <div style={{ padding: '6px 8px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {platforms.map(p => (
          <button key={p} onClick={() => setSelectedPlatform(p)}
            style={{
              padding: '3px 8px', borderRadius: 12, fontSize: 10,
              border: selectedPlatform === p ? '1px solid #7C5CFC' : '1px solid #333',
              background: selectedPlatform === p ? '#7C5CFC22' : 'transparent',
              color: selectedPlatform === p ? '#7C5CFC' : '#888',
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
                padding: '8px 10px', margin: '2px 0', borderRadius: 6,
                border: isActive ? '1px solid #7C5CFC' : '1px solid transparent',
                background: isActive ? '#7C5CFC15' : 'transparent',
                cursor: preset.id === 'custom' ? 'default' : 'pointer',
                transition: 'all 0.1s',
                opacity: preset.id === 'custom' ? 0.5 : 1,
              }}>
              <div style={{ fontSize: 12, color: '#ccc', display: 'flex', justifyContent: 'space-between' }}>
                <span>{preset.name}</span>
                {isActive && <span style={{ fontSize: 10, color: '#7C5CFC' }}>✓ Active</span>}
              </div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                {preset.width} × {preset.height}
                {preset.safeZone && ' · Includes safe zone'}
              </div>
              {/* Mini ratio preview */}
              <div style={{
                marginTop: 5, width: '100%', height: 30, background: '#222',
                borderRadius: 3, border: '1px solid #333',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', inset: 4, border: '1px dashed #444',
                  borderRadius: 1,
                }} />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 8, color: '#555',
                }}>
                  {preset.width}:{preset.height}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Template workflow hint */}
      <div style={{
        padding: '8px 12px', borderTop: '1px solid #333',
        fontSize: 10, color: '#666', textAlign: 'center',
      }}>
        💡 Upload image → AI auto-splits into layers
      </div>
    </div>
  );
}
