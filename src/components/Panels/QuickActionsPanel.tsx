import React, { useCallback, useState, useEffect } from 'react';
import { useEditor } from '../../store/editorStore';

let _filters: any = null;
async function getFilters() {
  if (!_filters) { const m = await import('fabric'); _filters = m.filters; }
  return _filters;
}

export default function QuickActionsPanel() {
  const { fabricRef, saveSnapshot } = useEditor();
  const [f, setF] = useState<any>(null);

  useEffect(() => { getFilters().then(setF); }, []);

  const run = useCallback((fn: (o: any) => void) => {
    const c = fabricRef.current; if (!c || !f) return;
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { fn(o); o.applyFilters(); }
    });
    c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot, f]);

  const tr = useCallback((fn: (o: any) => void) => {
    const c = fabricRef.current; if (!c) return;
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      fn(o);
    });
    c.renderAll(); saveSnapshot();
  }, [fabricRef, saveSnapshot]);

  if (!f) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>Loading filters...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header"><span className="title">ADJUSTMENTS</span><span className="badge">1‑CLICK</span></div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        <Group label="COLOR">
          <Btn label="Invert" onClick={() => run(o => o.filters.push(new f.Invert()))} />
          <Btn label="B&W" onClick={() => run(o => o.filters.push(new f.Grayscale()))} />
          <Btn label="Sepia" onClick={() => run(o => o.filters.push(new f.Sepia()))} />
          <Btn label="Vintage" onClick={() => run(o => { o.filters.push(new f.Sepia()); o.filters.push(new f.Brightness({ brightness: -0.05 })); o.filters.push(new f.Contrast({ contrast: -0.1 })); })} />
        </Group>
        <Group label="ADJUST">
          <Btn label="Brighten" onClick={() => run(o => o.filters.push(new f.Brightness({ brightness: 0.1 })))} />
          <Btn label="Darken" onClick={() => run(o => o.filters.push(new f.Brightness({ brightness: -0.1 })))} />
          <Btn label="Contrast +" onClick={() => run(o => o.filters.push(new f.Contrast({ contrast: 0.15 })))} />
          <Btn label="Contrast −" onClick={() => run(o => o.filters.push(new f.Contrast({ contrast: -0.1 })))} />
          <Btn label="Saturate" onClick={() => run(o => o.filters.push(new f.Saturation({ saturation: 0.2 })))} />
          <Btn label="Desaturate" onClick={() => run(o => o.filters.push(new f.Saturation({ saturation: -0.5 })))} />
          <Btn label="Reset All" onClick={() => run(o => { o.filters = []; })} />
        </Group>
        <Group label="FILTER">
          <Btn label="Blur" onClick={() => run(o => o.filters.push(new f.Blur({ blur: 0.4 })))} />
          <Btn label="Blur More" onClick={() => run(o => o.filters.push(new f.Blur({ blur: 0.8 })))} />
          <Btn label="Sharpen" onClick={() => run(o => o.filters.push(new f.Contrast({ contrast: 0.1 })))} />
          <Btn label="Noise" onClick={() => run(o => o.filters.push(new f.Noise({ noise: 20 })))} />
          <Btn label="Pixelate" onClick={() => run(o => o.filters.push(new f.Pixelate({ blocksize: 6 })))} />
        </Group>
        <Group label="TRANSFORM">
          <Btn label="Flip H" onClick={() => tr(o => o.set('flipX', !o.flipX))} />
          <Btn label="Flip V" onClick={() => tr(o => o.set('flipY', !o.flipY))} />
          <Btn label="Rotate 90°" onClick={() => tr(o => o.rotate((o.angle || 0) + 90))} />
          <Btn label="Duplicate" onClick={() => {
            const c = fabricRef.current; if (!c) return;
            const a = c.getActiveObject(); if (!a) return;
            a.clone().then((cl: any) => { cl.set({ left: (cl.left || 0) + 20, top: (cl.top || 0) + 20 }); c.add(cl); c.setActiveObject(cl); saveSnapshot(); });
          }} />
        </Group>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: 800, letterSpacing: 1.8, color: 'var(--text-disabled)', padding: '2px 6px 8px' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{children}</div>
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
