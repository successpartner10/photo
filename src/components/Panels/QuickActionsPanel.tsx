import React, { useCallback, useState, useEffect } from 'react';
import { useEditor } from '../../store/editorStore';

let _f: any = null;
async function getF() { if (!_f) { const m = await import('fabric'); _f = m.filters; } return _f; }

export default function QuickActionsPanel() {
  const { fabricRef, saveSnapshot } = useEditor();
  const [f, setF] = useState<any>(null);
  useEffect(() => { getF().then(setF); }, []);

  const run = useCallback((fn: (o: any) => void) => {
    const c = fabricRef.current; if (!c || !f) return;
    c.getObjects().forEach((o: any) => { if (o.data?.isBackground || o.data?.isCheckerboard) return; if (o.filters) { fn(o); o.applyFilters(); } });
    c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot, f]);

  const tr = useCallback((fn: (o: any) => void) => {
    const c = fabricRef.current; if (!c) return;
    c.getObjects().forEach((o: any) => { if (o.data?.isBackground || o.data?.isCheckerboard) return; fn(o); });
    c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot]);

  if (!f) return <div style={{ padding: 16, color: 'var(--ps-text-muted)', fontSize: 11 }}>Loading...</div>;

  const groups = [
    {
      label: 'COLOR',
      items: [
        { l: 'Invert', o: () => run(o => o.filters.push(new f.Invert())) },
        { l: 'B&W', o: () => run(o => o.filters.push(new f.Grayscale())) },
        { l: 'Sepia', o: () => run(o => o.filters.push(new f.Sepia())) },
        { l: 'Vintage', o: () => run(o => { o.filters.push(new f.Sepia()); o.filters.push(new f.Brightness({ brightness: -0.05 })); o.filters.push(new f.Contrast({ contrast: -0.1 })); }) },
      ],
    },
    {
      label: 'ADJUST',
      items: [
        { l: 'Brighten', o: () => run(o => o.filters.push(new f.Brightness({ brightness: 0.1 }))) },
        { l: 'Darken', o: () => run(o => o.filters.push(new f.Brightness({ brightness: -0.1 }))) },
        { l: 'Contrast +', o: () => run(o => o.filters.push(new f.Contrast({ contrast: 0.15 }))) },
        { l: 'Contrast −', o: () => run(o => o.filters.push(new f.Contrast({ contrast: -0.1 }))) },
        { l: 'Saturate', o: () => run(o => o.filters.push(new f.Saturation({ saturation: 0.2 }))) },
        { l: 'Desaturate', o: () => run(o => o.filters.push(new f.Saturation({ saturation: -0.5 }))) },
        { l: 'Reset All', o: () => run(o => { o.filters = []; }) },
      ],
    },
    {
      label: 'FILTER',
      items: [
        { l: 'Blur', o: () => run(o => o.filters.push(new f.Blur({ blur: 0.4 }))) },
        { l: 'Blur More', o: () => run(o => o.filters.push(new f.Blur({ blur: 0.8 }))) },
        { l: 'Sharpen', o: () => run(o => o.filters.push(new f.Contrast({ contrast: 0.1 }))) },
        { l: 'Noise', o: () => run(o => o.filters.push(new f.Noise({ noise: 20 }))) },
        { l: 'Pixelate', o: () => run(o => o.filters.push(new f.Pixelate({ blocksize: 6 }))) },
      ],
    },
    {
      label: 'TRANSFORM',
      items: [
        { l: 'Flip H', o: () => tr(o => o.set('flipX', !o.flipX)) },
        { l: 'Flip V', o: () => tr(o => o.set('flipY', !o.flipY)) },
        { l: 'Rotate 90°', o: () => tr(o => o.rotate((o.angle || 0) + 90)) },
        { l: 'Duplicate', o: () => { const c = fabricRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; a.clone().then((cl: any) => { cl.set({ left: (cl.left || 0) + 20, top: (cl.top || 0) + 20 }); c.add(cl); c.setActiveObject(cl); saveSnapshot(); }); } },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ps-panel)' }}>
      {groups.map(g => (
        <div key={g.label} style={{ padding: '6px 8px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ps-text-muted)', marginBottom: 4 }}>{g.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {g.items.map(a => (
              <button key={a.l} onClick={a.o}
                style={{
                  padding: '5px 4px', fontSize: 10, color: 'var(--ps-text-dim)',
                  background: 'var(--ps-input)', border: '1px solid #333',
                  cursor: 'pointer', textAlign: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--ps-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--ps-input)'; }}>
                {a.l}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
