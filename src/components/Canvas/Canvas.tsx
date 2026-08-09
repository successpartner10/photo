import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useEditor } from '../../store/editorStore';

const Canvas = forwardRef<any, {}>((_props, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<any>(null);
  const { state, dispatch, doc, fabricRef, saveSnapshot, addLayer } = useEditor();
  const isDrawingRef = useRef<string | null>(null);
  const penPts = useRef<{ x: number; y: number }[]>([]);
  const penPoly = useRef<any>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [loading, setLoading] = useState(true);
  const importFnRef = useRef<((f: File) => void) | null>(null);

  function uid(p: string) { return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

  useEffect(() => {
    if (!canvasEl.current || fcRef.current) return;
    let disposed = false;

    import('fabric').then(({ Canvas: FabricCanvas, Rect, Ellipse, Line, IText, Polyline, Image: FabricImage, filters }) => {
      if (disposed || !canvasEl.current) return;

      const c = new FabricCanvas(canvasEl.current, {
        width: doc.canvas.width, height: doc.canvas.height,
        backgroundColor: doc.canvas.backgroundColor,
        preserveObjectStacking: true, selection: true,
        stopContextMenu: true, fireRightClick: true,
      });
      fcRef.current = c; fabricRef.current = c;
      if (typeof ref === 'function') ref(c); else if (ref) (ref as any).current = c;
      setLoading(false);

      c.on('selection:created', saveSnapshot);
      c.on('selection:updated', saveSnapshot);
      c.on('object:modified', saveSnapshot);

      c.on('mouse:wheel', (opt: any) => {
        const d = opt.e.deltaY;
        const z = Math.min(30, Math.max(0.05, c.getZoom() * 0.999 ** d));
        c.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, z);
        setZoomPct(Math.round(z * 100));
        opt.e.preventDefault(); opt.e.stopPropagation();
      });

      let panning = false;
      c.on('mouse:down', (opt: any) => {
        if (opt.e.button === 1 || (opt.e.altKey && opt.e.button === 0)) { panning = true; c.selection = false; }
      });
      c.on('mouse:move', (opt: any) => {
        if (panning) { const v = c.viewportTransform!; v[4] += opt.e.movementX || 0; v[5] += opt.e.movementY || 0; c.requestRenderAll(); }
      });
      c.on('mouse:up', () => { panning = false; c.selection = true; });

      function handleMD(o: any) {
        if (panning) return;
        const p = c.getScenePoint(o.e), t = state.tool;
        if (t === 'brush' || t === 'eraser') { c.isDrawingMode = true; if (c.freeDrawingBrush) { c.freeDrawingBrush.color = t === 'eraser' ? doc.canvas.backgroundColor : '#000'; c.freeDrawingBrush.width = t === 'brush' ? 6 : 24; } return; }
        c.isDrawingMode = false;
        if (t === 'rect') { const r = new Rect({ left: p.x, top: p.y, width: 1, height: 1, fill: '#4A90D9', stroke: '#1a1a1a', strokeWidth: 2 }); (r as any).__draw = { sx: p.x, sy: p.y }; c.add(r); c.setActiveObject(r); isDrawingRef.current = 'rect'; } else if (t === 'ellipse') { const e = new Ellipse({ left: p.x, top: p.y, rx: 1, ry: 1, fill: '#E85D75', stroke: '#1a1a1a', strokeWidth: 2 }); (e as any).__draw = { sx: p.x, sy: p.y }; c.add(e); c.setActiveObject(e); isDrawingRef.current = 'ellipse'; } else if (t === 'line') { const l = new Line([p.x, p.y, p.x, p.y], { stroke: '#333', strokeWidth: 3 }); (l as any).__draw = { sx: p.x, sy: p.y }; c.add(l); c.setActiveObject(l); isDrawingRef.current = 'line'; } else if (t === 'text') { const tx = new IText('Type here', { left: p.x, top: p.y, fontFamily: 'Segoe UI, sans-serif', fontSize: 36, fill: '#fff' }); c.add(tx); c.setActiveObject(tx); addLayer({ name: 'Text', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false }); dispatch({ type: 'SET_TOOL', payload: 'select' }); saveSnapshot(); } else if (t === 'pen') { if (!penPoly.current) { const pp = new Polyline([], { fill: 'transparent', stroke: '#3784f0', strokeWidth: 2, selectable: false, evented: false }); c.add(pp); penPoly.current = pp; penPts.current = []; } penPts.current.push({ x: p.x, y: p.y }); penPoly.current.set({ points: [...penPts.current] }); c.renderAll(); }
      }
      function handleMM(o: any) {
        if (!isDrawingRef.current) return;
        const p = c.getScenePoint(o.e), obj = c.getActiveObject(); if (!obj) return;
        if (isDrawingRef.current === 'rect') { const d = (obj as any).__draw; obj.set({ width: Math.abs(p.x - d.sx), height: Math.abs(p.y - d.sy), left: p.x > d.sx ? d.sx : p.x, top: p.y > d.sy ? d.sy : p.y }); } else if (isDrawingRef.current === 'ellipse') { const d = (obj as any).__draw; obj.set({ rx: Math.abs(p.x - d.sx) / 2, ry: Math.abs(p.y - d.sy) / 2, left: Math.min(d.sx, p.x), top: Math.min(d.sy, p.y) }); } else if (isDrawingRef.current === 'line') obj.set({ x2: p.x, y2: p.y });
        c.renderAll();
      }
      function handleMU() { if (isDrawingRef.current) { addLayer({ name: isDrawingRef.current === 'rect' ? 'Rect' : isDrawingRef.current === 'ellipse' ? 'Ellipse' : 'Line', type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false }); saveSnapshot(); isDrawingRef.current = null; dispatch({ type: 'SET_TOOL', payload: 'select' }); } }
      function handleDel() { c.getActiveObjects().forEach((o: any) => c.remove(o)); c.discardActiveObject(); c.renderAll(); saveSnapshot(); }

      c.on('mouse:down', handleMD);
      c.on('mouse:move', handleMM);
      c.on('mouse:up', handleMU);

      const k = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
        if (ctrl && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) { e.preventDefault(); dispatch({ type: 'REDO' }); }
        if (e.key === 'Delete' || e.key === 'Backspace') handleDel();
        if (e.key === 'Escape') { c.discardActiveObject(); c.renderAll(); }
        if (!ctrl) { const m: any = { v: 'select', m: 'move', r: 'rect', e: 'ellipse', l: 'line', t: 'text', p: 'pen', b: 'brush', g: 'fill', w: 'magic-wand', s: 'clone', h: 'healing', u: 'shape-builder' }; const t2 = m[e.key.toLowerCase()]; if (t2) { e.preventDefault(); dispatch({ type: 'SET_TOOL', payload: t2 }); } }
      };
      window.addEventListener('keydown', k);
      (c as any).__k = k;

      const bg = new Rect({ width: doc.canvas.width, height: doc.canvas.height, fill: doc.canvas.backgroundColor, selectable: false, evented: false, excludeFromExport: true });
      (bg as any).data = { isBackground: true };
      c.add(bg); c.renderAll();

      const el = canvasEl.current!;
      const dgo = (e: DragEvent) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'copy'; };
      const dg = (e: DragEvent) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) handleFileImport(f); };
      el.addEventListener('dragover', dgo); el.addEventListener('drop', dg);
      (c as any).__dnd = () => { el.removeEventListener('dragover', dgo); el.removeEventListener('drop', dg); };

      async function handleFileImport(file: File) {
        const reader = new FileReader();
        reader.onload = async e2 => {
          const dataUrl = e2.target?.result as string;
          const img = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = dataUrl; });
          const scale = Math.min((doc.canvas.width * 0.88) / img.width, (doc.canvas.height * 0.88) / img.height, 1);
          const fImg = new FabricImage(img, { left: (doc.canvas.width - img.width * scale) / 2, top: (doc.canvas.height - img.height * scale) / 2, scaleX: scale, scaleY: scale });
          (fImg as any).data = { layerId: uid('import'), isSourceImage: true };
          (fImg as any)._htmlImageElement = img;
          c.add(fImg); c.setActiveObject(fImg); c.renderAll();
          addLayer({ name: file.name || 'Import', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
          saveSnapshot();
        };
        reader.readAsDataURL(file);
      }
      importFnRef.current = handleFileImport;

      (c as any).applyFilter = (ft: string) => {
        c.getObjects().forEach((o: any) => { if (o.data?.isBackground || o.data?.isCheckerboard) return; if (!o.filters) o.filters = []; if (ft === 'grayscale' && filters.Grayscale) o.filters.push(new filters.Grayscale()); else if (ft === 'sepia' && filters.Sepia) o.filters.push(new filters.Sepia()); else if (ft === 'invert' && filters.Invert) o.filters.push(new filters.Invert()); else if (ft === 'blur' && filters.Blur) o.filters.push(new filters.Blur({ blur: 0.5 })); o.applyFilters(); });
        c.renderAll(); saveSnapshot();
      };
    });

    return () => {
      disposed = true; const cc = fcRef.current;
      if (cc) { if ((cc as any).__k) window.removeEventListener('keydown', (cc as any).__k); if ((cc as any).__dnd) (cc as any).__dnd(); cc.dispose(); fcRef.current = null; fabricRef.current = null; }
    };
  }, []);

  useEffect(() => { const c = fcRef.current; if (!c) return; if (state.tool !== 'brush' && state.tool !== 'eraser') c.isDrawingMode = false; if (c.freeDrawingBrush) { c.freeDrawingBrush.color = state.tool === 'eraser' ? doc.canvas.backgroundColor : '#000'; c.freeDrawingBrush.width = state.tool === 'brush' ? 6 : 24; } }, [state.tool]);
  useEffect(() => { const c = fcRef.current; if (!c) return; c.setWidth(doc.canvas.width); c.setHeight(doc.canvas.height); c.backgroundColor = doc.canvas.backgroundColor; const bg = c.getObjects().find((o: any) => o.data?.isBackground); if (bg) bg.set({ width: doc.canvas.width, height: doc.canvas.height, fill: doc.canvas.backgroundColor }); c.renderAll(); }, [doc.canvas.width, doc.canvas.height, doc.canvas.backgroundColor]);

  const applyFilter = useCallback((ft: string) => { const c = fcRef.current; if (!c || !(c as any).applyFilter) return; (c as any).applyFilter(ft); }, []);

  function finishPen() { const c = fcRef.current; if (!c || !penPoly.current) return; penPoly.current.set({ selectable: true, evented: true }); penPoly.current = null; penPts.current = []; addLayer({ name: 'Path', type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false }); dispatch({ type: 'SET_TOOL', payload: 'select' }); saveSnapshot(); }

  useImperativeHandle(ref, () => ({ importFile: (file: File) => { if (importFnRef.current) importFnRef.current(file); }, getCanvas: () => fcRef.current, finishPen }), []);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111', position: 'relative' }} ref={containerRef}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ps-bg)', zIndex: 50, flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>Inkception</div>
          <div style={{ fontSize: 11, color: 'var(--ps-text-muted)' }}>Loading canvas...</div>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161616' }}>
        <div style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
          <canvas ref={canvasEl} />
        </div>
      </div>

      {/* Pen toolbar */}
      {state.tool === 'pen' && (
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'var(--ps-panel)', border: '1px solid #222', padding: '6px 12px', display: 'flex', gap: 6, zIndex: 10, fontSize: 11, color: 'var(--ps-text-dim)' }}>
          <span>Pen — Click to add points</span>
          <button onClick={finishPen} className="ps-btn ps-btn-accent" style={{ fontSize: 10, padding: '2px 8px' }}>Finish</button>
          <button onClick={() => { penPts.current = []; if (penPoly.current && fcRef.current) fcRef.current.remove(penPoly.current); penPoly.current = null; dispatch({ type: 'SET_TOOL', payload: 'select' }); }} className="ps-btn" style={{ fontSize: 10, padding: '2px 8px' }}>Cancel</button>
        </div>
      )}

      {/* Zoom */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 2, background: 'var(--ps-panel)', border: '1px solid #222', padding: '2px 6px', fontSize: 10, color: 'var(--ps-text-dim)' }}>
        <button onClick={() => { const c = fcRef.current; if (c) { c.zoomToPoint({ x: c.width! / 2, y: c.height! / 2 }, Math.max(0.05, c.getZoom() / 1.25)); setZoomPct(Math.round(c.getZoom() * 100)); } }} style={zBtn}>−</button>
        <span style={{ minWidth: 40, textAlign: 'center' }}>{zoomPct}%</span>
        <button onClick={() => { const c = fcRef.current; if (c) { c.zoomToPoint({ x: c.width! / 2, y: c.height! / 2 }, Math.min(30, c.getZoom() * 1.25)); setZoomPct(Math.round(c.getZoom() * 100)); } }} style={zBtn}>+</button>
      </div>
    </div>
  );
});

export default Canvas;
const zBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--ps-text-dim)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 0 };
