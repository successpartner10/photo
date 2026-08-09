import React, { useState, useCallback, useRef } from 'react';
import { useEditor } from '../../store/editorStore';

type CollageLayout = 'grid-2' | 'grid-3' | 'grid-4' | 'masonry' | 'horizontal' | 'vertical' | 'hero-sidekick' | 'diptych' | 'triptych' | 'quad' | 'polaroid-spread' | 'overlap';

const LAYOUTS: { id: CollageLayout; label: string; color: string }[] = [
  { id: 'grid-2', label: '2 GRID', color: 'var(--accent)' },
  { id: 'grid-3', label: '3 GRID', color: 'var(--c-teal)' },
  { id: 'grid-4', label: '4 GRID', color: 'var(--c-red)' },
  { id: 'diptych', label: 'DIPTYCH', color: 'var(--info)' },
  { id: 'triptych', label: 'TRIPTYCH', color: 'var(--c-orange)' },
  { id: 'quad', label: 'QUAD', color: 'var(--c-amber)' },
  { id: 'hero-sidekick', label: 'HERO + SIDE', color: 'var(--c-purple)' },
  { id: 'horizontal', label: 'HORIZONTAL', color: 'var(--c-teal)' },
  { id: 'vertical', label: 'VERTICAL', color: 'var(--c-red)' },
  { id: 'masonry', label: 'MASONRY', color: 'var(--c-amber)' },
  { id: 'overlap', label: 'OVERLAP', color: 'var(--danger)' },
  { id: 'polaroid-spread', label: 'POLAROID', color: 'var(--info)' },
];

const PAGE_SIZE = 4;

function layoutFor(id: CollageLayout, slots: number, W: number, H: number) {
  const pad = 12; const gW = W - pad * 2, gH = H - pad * 2;
  switch (id) {
    case 'grid-2': { const hw = (gW - pad) / 2; return [{ x: pad, y: pad, w: hw, h: gH }, { x: pad + hw + pad, y: pad, w: hw, h: gH }]; }
    case 'grid-3': { const tw = (gW - pad * 2) / 3; return [{ x: pad, y: pad, w: tw, h: gH }, { x: pad + tw + pad, y: pad, w: tw, h: gH }, { x: pad + (tw + pad) * 2, y: pad, w: tw, h: gH }]; }
    case 'grid-4': { const qw = (gW - pad) / 2, qh = (gH - pad) / 2; return [{ x: pad, y: pad, w: qw, h: qh }, { x: pad + qw + pad, y: pad, w: qw, h: qh }, { x: pad, y: pad + qh + pad, w: qw, h: qh }, { x: pad + qw + pad, y: pad + qh + pad, w: qw, h: qh }]; }
    case 'hero-sidekick': { const hw2 = (gW - pad) * 0.65, sw = (gW - pad) * 0.35; return [{ x: pad, y: pad, w: hw2, h: gH }, { x: pad + hw2 + pad, y: pad, w: sw, h: (gH - pad) / 2 }, { x: pad + hw2 + pad, y: pad + (gH - pad) / 2 + pad, w: sw, h: (gH - pad) / 2 }]; }
    case 'horizontal': { const hH = (gH - pad * (slots - 1)) / slots; return Array.from({ length: slots }, (_, i) => ({ x: pad, y: pad + i * (hH + pad), w: gW, h: hH })); }
    case 'vertical': { const vW = (gW - pad * (slots - 1)) / slots; return Array.from({ length: slots }, (_, i) => ({ x: pad + i * (vW + pad), y: pad, w: vW, h: gH })); }
    case 'diptych': { const hw3 = (gW - pad) / 2; return [{ x: pad, y: pad, w: hw3, h: gH }, { x: pad + hw3 + pad, y: pad, w: hw3, h: gH }]; }
    case 'triptych': { const tw2 = (gW - pad * 2) / 3; return [{ x: pad, y: pad, w: tw2, h: gH }, { x: pad + tw2 + pad, y: pad, w: tw2, h: gH }, { x: pad + (tw2 + pad) * 2, y: pad, w: tw2, h: gH }]; }
    case 'quad': { const qw2 = (gW - pad) / 2, qh2 = (gH - pad) / 2; return [{ x: pad, y: pad, w: qw2, h: qh2 }, { x: pad + qw2 + pad, y: pad, w: qw2, h: qh2 }, { x: pad, y: pad + qh2 + pad, w: qw2, h: qh2 }, { x: pad + qw2 + pad, y: pad + qh2 + pad, w: qw2, h: qh2 }]; }
    case 'masonry': { const cols = 3, cw = (gW - pad * 2) / cols; const heights = [gH * 0.4, gH * 0.55, gH * 0.35, gH * 0.5, gH * 0.45]; const s: any[] = []; let cy = pad; for (let i = 0; i < Math.min(heights.length, 6); i++) { const col = i % cols; s.push({ x: pad + col * (cw + pad), y: cy, w: cw, h: heights[i] }); if (col === cols - 1) cy += heights[i] + pad; } return s; }
    case 'overlap': { const cw2 = gW * 0.6, ch = gH * 0.6; return [{ x: pad, y: pad, w: cw2, h: ch }, { x: gW - cw2 - pad, y: pad + 40, w: cw2, h: ch }, { x: pad + 40, y: gH - ch - pad, w: cw2, h: ch }]; }
    case 'polaroid-spread': { const pw = gW * 0.28, ph = gH * 0.4; return [{ x: pad, y: pad + 10, w: pw, h: ph }, { x: pad + pw + 24, y: pad - 5, w: pw, h: ph }, { x: pad + (pw + 24) * 2, y: pad + 15, w: pw, h: ph }]; }
    default: return [{ x: pad, y: pad, w: gW, h: gH }];
  }
}

export default function CollagePanel() {
  const { doc, fabricRef, addLayer, saveSnapshot } = useEditor();
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [layout, setLayout] = useState<CollageLayout>('grid-2');
  const [page, setPage] = useState(0);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pages = Math.ceil(LAYOUTS.length / PAGE_SIZE);
  const visibleLayouts = LAYOUTS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleAddPhotos = useCallback((files: FileList) => {
    const readers = Array.from(files).map(f => new Promise<HTMLImageElement>(resolve => {
      const reader = new FileReader();
      reader.onload = e => { const img = new Image(); img.onload = () => resolve(img); img.src = e.target?.result as string; };
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => setImages(prev => [...prev, ...imgs].slice(0, 12)));
  }, []);

  const handleBuildCollage = useCallback(async () => {
    const canvas = fabricRef.current; if (!canvas || images.length < 2) return;
    setProcessing(true);

    const { Image: FabricImage } = await import('fabric');

    canvas.getObjects().forEach((o: any) => { if (o.data?.isCollage) canvas.remove(o); });

    const W = doc.canvas.width, H = doc.canvas.height;
    const slots = layoutFor(layout, images.length, W, H);
    const imgCount = Math.min(images.length, slots.length);

    for (let i = 0; i < imgCount; i++) {
      const slot = slots[i];
      const fImg = new FabricImage(images[i], { left: slot.x, top: slot.y, width: slot.w, height: slot.h, objectCaching: false });
      (fImg as any).data = { layerId: `collage-${Date.now()}-${i}`, isCollage: true };
      canvas.add(fImg);
      addLayer({ name: `Collage ${i + 1}`, type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    }
    canvas.renderAll(); saveSnapshot(); setProcessing(false);
  }, [fabricRef, images, layout, doc.canvas, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">COLLAGE</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, color: 'var(--text-disabled)' }}>{images.length} PHOTOS</span>
      </div>
      <div style={{ padding: '10px' }}>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files) handleAddPhotos(e.target.files); }} />
        <div style={{ border: '2px dashed var(--border-default)', borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center', background: 'var(--bg-elevated)', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, marginBottom: 4 }}>+ ADD PHOTOS</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 8, color: 'var(--text-muted)' }}>Select multiple images (2–12)</div>
        </div>
        {images.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border-default)', position: 'relative' }}>
                <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 0, right: 0, width: 14, height: 14, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
            <button onClick={() => setImages([])} style={{ padding: '4px 8px', borderRadius: 'var(--radius)', border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700 }}>CLEAR</button>
          </div>
        )}
      </div>
      <div style={{ padding: '4px 10px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-disabled)', marginBottom: 6 }}>CHOOSE LAYOUT</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {visibleLayouts.map(l => (
            <button key={l.id} onClick={() => setLayout(l.id)} style={{
              padding: '9px 6px', borderRadius: 'var(--radius)',
              border: layout === l.id ? `1px solid ${l.color}` : '1px solid var(--border-default)',
              background: layout === l.id ? `${l.color}10` : 'var(--bg-elevated)',
              cursor: 'pointer', textAlign: 'center', borderLeft: `3px solid ${l.color}`,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1, color: layout === l.id ? l.color : 'var(--text-muted)' }}>{l.label}</div>
            </button>
          ))}
        </div>
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 6 }}>
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{ width: i === page ? 12 : 5, height: 5, borderRadius: 3, background: i === page ? 'var(--accent)' : 'var(--border-default)', border: 'none', cursor: 'pointer' }} />
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <button onClick={() => setPage(p => (p + 1) % pages)} style={{ padding: '3px 10px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 700, letterSpacing: 1, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'pointer' }}>MORE ({page + 1}/{pages})</button>
        </div>
      </div>
      <div style={{ padding: '10px', marginTop: 'auto' }}>
        <button onClick={handleBuildCollage} disabled={images.length < 2 || processing} style={{
          width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: 'none',
          background: images.length >= 2 && !processing ? 'var(--accent)' : 'var(--bg-overlay)',
          color: images.length >= 2 && !processing ? '#fff' : 'var(--text-disabled)',
          cursor: images.length >= 2 && !processing ? 'pointer' : 'default',
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
        }}>{processing ? 'BUILDING...' : `BUILD COLLAGE`}</button>
      </div>
    </div>
  );
}
