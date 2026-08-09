import React, { useCallback } from 'react';
import { filters } from 'fabric';
import { useEditor } from '../../store/editorStore';

export default function QuickActionsPanel() {
  const { fabricRef, saveSnapshot } = useEditor();

  const apply = useCallback((fn: (o: any) => void) => {
    const c = fabricRef.current; if (!c) return;
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { fn(o); o.applyFilters(); }
    });
    c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot]);

  const transformAll = useCallback((fn: (o: any) => void) => {
    const c = fabricRef.current; if (!c) return;
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      fn(o);
    });
    c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header"><span className="title">ADJUSTMENTS</span><span className="badge">1‑CLICK</span></div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

        {/* COLOR */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800, letterSpacing: 1.8, color: 'var(--text-disabled)', padding: '2px 6px 8px' }}>COLOR</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Btn label="Invert" onClick={() => apply(o => o.filters.push(new filters.Invert()))} />
            <Btn label="B&W" onClick={() => apply(o => o.filters.push(new filters.Grayscale()))} />
            <Btn label="Sepia" onClick={() => apply(o => o.filters.push(new filters.Sepia()))} />
            <Btn label="Vintage" onClick={() => apply(o => { o.filters.push(new filters.Sepia()); o.filters.push(new filters.Brightness({ brightness: -0.05 })); o.filters.push(new filters.Contrast({ contrast: -0.1 })); })} />
          </div>
        </div>

        {/* ADJUST */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800, letterSpacing: 1.8, color: 'var(--text-disabled)', padding: '2px 6px 8px' }}>ADJUST</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Btn label="Brighten" onClick={() => apply(o => o.filters.push(new filters.Brightness({ brightness: 0.1 })))} />
            <Btn label="Darken" onClick={() => apply(o => o.filters.push(new filters.Brightness({ brightness: -0.1 })))} />
            <Btn label="Contrast +" onClick={() => apply(o => o.filters.push(new filters.Contrast({ contrast: 0.15 })))} />
            <Btn label="Contrast −" onClick={() => apply(o => o.filters.push(new filters.Contrast({ contrast: -0.1 })))} />
            <Btn label="Saturate" onClick={() => apply(o => o.filters.push(new filters.Saturation({ saturation: 0.2 })))} />
            <Btn label="Desaturate" onClick={() => apply(o => o.filters.push(new filters.Saturation({ saturation: -0.5 })))} />
            <Btn label="Reset All" onClick={() => apply(o => { o.filters = []; })} />
          </div>
        </div>

        {/* FILTER */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800, letterSpacing: 1.8, color: 'var(--text-disabled)', padding: '2px 6px 8px' }}>FILTER</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Btn label="Blur" onClick={() => apply(o => o.filters.push(new filters.Blur({ blur: 0.4 })))} />
            <Btn label="Blur More" onClick={() => apply(o => o.filters.push(new filters.Blur({ blur: 0.8 })))} />
            <Btn label="Sharpen" onClick={() => apply(o => o.filters.push(new filters.Contrast({ contrast: 0.1 })))} />
            <Btn label="Noise" onClick={() => apply(o => o.filters.push(new filters.Noise({ noise: 20 })))} />
            <Btn label="Pixelate" onClick={() => apply(o => o.filters.push(new filters.Pixelate({ blocksize: 6 })))} />
          </div>
        </div>

        {/* TRANSFORM */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800, letterSpacing: 1.8, color: 'var(--text-disabled)', padding: '2px 6px 8px' }}>TRANSFORM</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <Btn label="Flip H" onClick={() => transformAll(o => o.set('flipX', !o.flipX))} />
            <Btn label="Flip V" onClick={() => transformAll(o => o.set('flipY', !o.flipY))} />
            <Btn label="Rotate 90°" onClick={() => transformAll(o => o.rotate((o.angle || 0) + 90))} />
            <Btn label="Duplicate" onClick={() => {
              const c = fabricRef.current; if (!c) return;
              const a = c.getActiveObject(); if (!a) return;
              a.clone().then((cl: any) => { cl.set({ left: (cl.left || 0) + 20, top: (cl.top || 0) + 20 }); c.add(cl); c.setActiveObject(cl); saveSnapshot(); });
            }} />
          </div>
        </div>

      </div>
    </div>
  );
}

function Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 6px', borderRadius: 'var(--radius)',
      border: '1px solid var(--border-default)', background: 'var(--bg-elevated)',
      cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 600,
      color: 'var(--text-secondary)', letterSpacing: 0.8, transition: 'all .08s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,.25)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
      {label}
    </button>
  );
}
