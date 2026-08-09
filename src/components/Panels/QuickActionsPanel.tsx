import React, { useCallback } from 'react';
import { filters } from 'fabric';
import { useEditor } from '../../store/editorStore';

export default function QuickActionsPanel() {
  const { fabricRef, saveSnapshot } = useEditor();

  const applyToCanvas = useCallback((fn: (c: any) => void) => {
    const c = fabricRef.current; if (!c) return;
    fn(c); c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot]);

  const run = (fn: (o: any) => void) => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { fn(o); o.applyFilters(); }
    });
  });

  const actions = [
    { id: 'invert', label: 'INVERT', cat: 'COLOR', onClick: () => run(o => { o.filters.push(new filters.Invert()); }) },
    { id: 'bw', label: 'B&W', cat: 'COLOR', onClick: () => run(o => { o.filters.push(new filters.Grayscale()); }) },
    { id: 'sepia', label: 'SEPIA', cat: 'COLOR', onClick: () => run(o => { o.filters.push(new filters.Sepia()); }) },
    { id: 'vintage', label: 'VINTAGE', cat: 'COLOR', onClick: () => run(o => { o.filters.push(new filters.Sepia()); o.filters.push(new filters.Brightness({ brightness: -0.05 })); o.filters.push(new filters.Contrast({ contrast: -0.1 })); }) },
    { id: 'brighten', label: 'BRIGHTEN', cat: 'ADJUST', onClick: () => run(o => { o.filters.push(new filters.Brightness({ brightness: 0.1 })); }) },
    { id: 'darken', label: 'DARKEN', cat: 'ADJUST', onClick: () => run(o => { o.filters.push(new filters.Brightness({ brightness: -0.1 })); }) },
    { id: 'contrast+', label: 'CONTRAST +', cat: 'ADJUST', onClick: () => run(o => { o.filters.push(new filters.Contrast({ contrast: 0.15 })); }) },
    { id: 'contrast-', label: 'CONTRAST −', cat: 'ADJUST', onClick: () => run(o => { o.filters.push(new filters.Contrast({ contrast: -0.1 })); }) },
    { id: 'sat+', label: 'SATURATE', cat: 'ADJUST', onClick: () => run(o => { o.filters.push(new filters.Saturation({ saturation: 0.2 })); }) },
    { id: 'desat', label: 'DESATURATE', cat: 'ADJUST', onClick: () => run(o => { o.filters.push(new filters.Saturation({ saturation: -0.5 })); }) },
    { id: 'blur', label: 'BLUR', cat: 'FILTERS', onClick: () => run(o => { o.filters.push(new filters.Blur({ blur: 0.3 })); }) },
    { id: 'blur+', label: 'BLUR MORE', cat: 'FILTERS', onClick: () => run(o => { o.filters.push(new filters.Blur({ blur: 0.7 })); }) },
    { id: 'sharpen', label: 'SHARPEN', cat: 'FILTERS', onClick: () => run(o => { o.filters.push(new filters.Contrast({ contrast: 0.1 })); }) },
    { id: 'noise', label: 'NOISE', cat: 'FILTERS', onClick: () => run(o => { o.filters.push(new filters.Noise({ noise: 20 })); }) },
    { id: 'pixel', label: 'PIXELATE', cat: 'FILTERS', onClick: () => run(o => { o.filters.push(new filters.Pixelate({ blocksize: 6 })); }) },
    { id: 'flip-h', label: 'FLIP H', cat: 'TRANSFORM', onClick: () => applyToCanvas(c => { c.getObjects().forEach((o: any) => { if (!o.data?.isBackground && !o.data?.isCheckerboard) o.set('flipX', !o.flipX); }); }) },
    { id: 'flip-v', label: 'FLIP V', cat: 'TRANSFORM', onClick: () => applyToCanvas(c => { c.getObjects().forEach((o: any) => { if (!o.data?.isBackground && !o.data?.isCheckerboard) o.set('flipY', !o.flipY); }); }) },
    { id: 'rot90', label: 'ROTATE 90°', cat: 'TRANSFORM', onClick: () => applyToCanvas(c => { c.getObjects().forEach((o: any) => { if (!o.data?.isBackground && !o.data?.isCheckerboard) o.rotate((o.angle || 0) + 90); }); }) },
    { id: 'reset', label: 'RESET ALL', cat: 'ADJUST', onClick: () => run(o => { o.filters = []; }) },
  ];

  const cats = ['COLOR', 'ADJUST', 'FILTERS', 'TRANSFORM'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">QUICK ACTIONS</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, color: 'var(--text-disabled)' }}>1-CLICK</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {cats.map(cat => {
          const items = actions.filter(a => a.cat === cat);
          return (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 800, letterSpacing: 2, color: 'var(--text-disabled)', padding: '2px 6px 8px' }}>
                {cat}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {items.map(a => (
                  <button key={a.id} onClick={a.onClick} style={{
                    padding: '9px 6px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
                    cursor: 'pointer', transition: 'all 0.08s',
                    fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
                    color: 'var(--text-secondary)', letterSpacing: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(124,92,252,0.3)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >{a.label}</button>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, padding: 14, border: '1px solid rgba(124,92,252,0.15)', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--bg-elevated)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1.5, marginBottom: 4 }}>
            AI TAB
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
            Auto enhance, background removal, generative fill & more
          </div>
        </div>
      </div>
    </div>
  );
}
