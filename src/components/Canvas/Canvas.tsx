import React, {
  useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef
} from 'react';
import {
  Canvas as FabricCanvas,
  Rect,
  Ellipse,
  Line,
  IText,
  Polyline,
  Image as FabricImage,
  Pattern,
  filters,
} from 'fabric';
import { useEditor } from '../../store/editorStore';
import { ToolType } from '../../types/editor';

function makeId(pref: string) { return `${pref}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const Canvas = forwardRef<any, {}>((_props, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<FabricCanvas | null>(null);
  const { state, dispatch, doc, fabricRef, saveSnapshot, addLayer, exportCanvas } = useEditor();
  const isDrawingRef = useRef<ToolType | null>(null);
  const penPointsRef = useRef<{ x: number; y: number }[]>([]);
  const penPolylineRef = useRef<Polyline | null>(null);
  const [zoomPct, setZoomPct] = useState(100);

  // ---- INIT ----
  useEffect(() => {
    if (!canvasEl.current || fcRef.current) return;
    let disposed = false;

    const c = new FabricCanvas(canvasEl.current, {
      width: doc.canvas.width,
      height: doc.canvas.height,
      backgroundColor: doc.canvas.backgroundColor,
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
      fireRightClick: true,
      perPixelTargetFind: true,
      targetFindTolerance: 4,
    });

    fcRef.current = c;
    fabricRef.current = c;
    if (typeof ref === 'function') ref(c);
    else if (ref) (ref as any).current = c;

    // Selection events
    c.on('selection:created', () => saveSnapshot());
    c.on('selection:updated', () => saveSnapshot());
    c.on('object:modified', () => saveSnapshot());

    // Mouse wheel zoom
    c.on('mouse:wheel', (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = c.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(zoom, 0.05), 30);
      c.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoomPct(Math.round(zoom * 100));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan with middle mouse / alt+drag
    let panning = false;
    c.on('mouse:down', (opt: any) => {
      if (opt.e.button === 1 || (opt.e.altKey && opt.e.button === 0)) {
        panning = true;
        c.selection = false;
      }
    });
    c.on('mouse:move', (opt: any) => {
      if (panning) {
        const e = opt.e;
        const vpt = c.viewportTransform!;
        vpt[4] += e.movementX || 0;
        vpt[5] += e.movementY || 0;
        c.requestRenderAll();
      }
    });
    c.on('mouse:up', () => { panning = false; c.selection = true; });

    // Drawing tool handlers
    c.on('mouse:down', (opt: any) => { if (!panning) handleMouseDown(c, opt); });
    c.on('mouse:move', (opt: any) => { handleMouseMove(c, opt); });
    c.on('mouse:up', (opt: any) => { handleMouseUp(c, opt); });

    // Keyboard shortcuts
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (ctrl && e.key === 'z' && !shift) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      if (ctrl && e.key === 'z' && shift) { e.preventDefault(); dispatch({ type: 'REDO' }); }
      if (ctrl && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      if (ctrl && e.key === 's') { e.preventDefault(); handleQuickSave(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { handleDeleteSelected(c); }
      if (e.key === 'Escape') { handleDeselect(); }
      if (!ctrl) {
        const toolMap: Record<string, ToolType> = {
          v: 'select', m: 'move', r: 'rect', e: 'ellipse', l: 'line',
          t: 'text', p: 'pen', b: 'brush', g: 'fill', w: 'magic-wand',
          s: 'clone', h: 'healing', u: 'shape-builder',
        };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) { e.preventDefault(); dispatch({ type: 'SET_TOOL', payload: tool }); }
      }
    };
    window.addEventListener('keydown', handleKey);
    (c as any).__keyHandler = handleKey;

    // Background rect
    const bg = new Rect({
      width: doc.canvas.width,
      height: doc.canvas.height,
      fill: doc.canvas.backgroundColor,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (bg as any).data = { layerId: 'bg-1', isBackground: true };
    c.add(bg);
    c.renderAll();

    // Drag & drop
    const el = canvasEl.current!;
    const onDragOver = (e: DragEvent) => { e.preventDefault(); e.dataTransfer!.dropEffect = 'copy'; };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFileImport(file, c);
    };
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);
    (c as any).__dndCleanup = () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };

    return () => {
      disposed = true;
      const cc = fcRef.current;
      if (cc) {
        if ((cc as any).__keyHandler) window.removeEventListener('keydown', (cc as any).__keyHandler);
        if ((cc as any).__dndCleanup) (cc as any).__dndCleanup();
        cc.dispose();
        fcRef.current = null;
        fabricRef.current = null;
      }
    };
  }, []);

  // ---- DRAWING ----
  function handleMouseDown(c: FabricCanvas, opt: any) {
    const tool = state.tool;
    const pointer = c.getScenePoint(opt.e);

    if (tool === 'brush' || tool === 'eraser') {
      c.isDrawingMode = true;
      if (c.freeDrawingBrush) {
        c.freeDrawingBrush.color = tool === 'eraser' ? doc.canvas.backgroundColor : '#000000';
        c.freeDrawingBrush.width = tool === 'brush' ? 5 : 20;
      }
      return;
    }
    c.isDrawingMode = false;

    if (tool === 'rect') {
      const obj = new Rect({
        left: pointer.x, top: pointer.y, width: 1, height: 1,
        fill: '#4A90D9', stroke: '#1a1a1a', strokeWidth: 2,
      });
      (obj as any).data = { layerId: makeId('shape') };
      (obj as any).__drawing = { startX: pointer.x, startY: pointer.y };
      c.add(obj); c.setActiveObject(obj);
      isDrawingRef.current = 'rect';
    } else if (tool === 'ellipse') {
      const obj = new Ellipse({
        left: pointer.x, top: pointer.y, rx: 1, ry: 1,
        fill: '#E85D75', stroke: '#1a1a1a', strokeWidth: 2,
      });
      (obj as any).data = { layerId: makeId('shape') };
      (obj as any).__drawing = { startX: pointer.x, startY: pointer.y };
      c.add(obj); c.setActiveObject(obj);
      isDrawingRef.current = 'ellipse';
    } else if (tool === 'line') {
      const obj = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
        stroke: '#333', strokeWidth: 3,
      });
      (obj as any).data = { layerId: makeId('shape') };
      (obj as any).__drawing = { startX: pointer.x, startY: pointer.y };
      c.add(obj); c.setActiveObject(obj);
      isDrawingRef.current = 'line';
    } else if (tool === 'text') {
      const obj = new IText('Type here', {
        left: pointer.x, top: pointer.y,
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: 32, fill: '#111',
      });
      (obj as any).data = { layerId: makeId('text') };
      c.add(obj); c.setActiveObject(obj);
      addLayer({ name: 'Text Layer', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      dispatch({ type: 'SET_TOOL', payload: 'select' });
      saveSnapshot();
    } else if (tool === 'pen') {
      if (!penPolylineRef.current) {
        const poly = new Polyline([], {
          fill: 'transparent', stroke: '#7C5CFC', strokeWidth: 3,
          selectable: false, evented: false,
        });
        (poly as any).data = { layerId: makeId('pen') };
        c.add(poly);
        penPolylineRef.current = poly;
        penPointsRef.current = [];
      }
      penPointsRef.current.push({ x: pointer.x, y: pointer.y });
      penPolylineRef.current.set({ points: [...penPointsRef.current] });
      c.renderAll();
    }
  }

  function handleMouseMove(c: FabricCanvas, opt: any) {
    if (!isDrawingRef.current) return;
    const pointer = c.getScenePoint(opt.e);
    const obj = c.getActiveObject();
    if (!obj) return;

    if (isDrawingRef.current === 'rect') {
      const d = (obj as any).__drawing;
      const w = pointer.x - d.startX;
      const h = pointer.y - d.startY;
      obj.set({
        width: Math.abs(w), height: Math.abs(h),
        left: w > 0 ? d.startX : pointer.x, top: h > 0 ? d.startY : pointer.y,
      });
    } else if (isDrawingRef.current === 'ellipse') {
      const d = (obj as any).__drawing;
      obj.set({
        rx: Math.abs(pointer.x - d.startX) / 2,
        ry: Math.abs(pointer.y - d.startY) / 2,
        left: Math.min(d.startX, pointer.x), top: Math.min(d.startY, pointer.y),
      });
    } else if (isDrawingRef.current === 'line') {
      obj.set({ x2: pointer.x, y2: pointer.y });
    }
    c.renderAll();
  }

  function handleMouseUp(c: FabricCanvas, _opt: any) {
    if (isDrawingRef.current) {
      const name = isDrawingRef.current === 'rect' ? 'Rectangle' : isDrawingRef.current === 'ellipse' ? 'Ellipse' : 'Line';
      addLayer({ name: `${name} ${doc.layers.length}`, type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      saveSnapshot();
      isDrawingRef.current = null;
      dispatch({ type: 'SET_TOOL', payload: 'select' });
    }
  }

  function handleDeleteSelected(c: FabricCanvas) {
    const active = c.getActiveObjects();
    active.forEach((o: any) => c.remove(o));
    c.discardActiveObject();
    c.renderAll();
    saveSnapshot();
  }

  function handleDeselect() {
    const c = fcRef.current;
    if (c) { c.discardActiveObject(); c.renderAll(); }
  }

  // ---- FILE IMPORT ----
  async function handleFileImport(file: File, c?: FabricCanvas) {
    const canvas = c || fcRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const img = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = dataUrl; });

      const fImg = new FabricImage(img, {
        left: Math.max(0, (doc.canvas.width - Math.min(img.width, doc.canvas.width * 0.8)) / 2),
        top: Math.max(0, (doc.canvas.height - Math.min(img.height, doc.canvas.height * 0.8)) / 2),
      });
      (fImg as any).data = { layerId: makeId('import') };

      if (img.width > doc.canvas.width * 0.8 || img.height > doc.canvas.height * 0.8) {
        fImg.scaleToWidth(doc.canvas.width * 0.8);
      }
      canvas.add(fImg);
      canvas.setActiveObject(fImg);
      canvas.renderAll();
      addLayer({ name: file.name || 'Imported', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      saveSnapshot();
    };
    reader.readAsDataURL(file);
  }

  function handleQuickSave() {
    const c = fcRef.current;
    if (!c) return;
    const dataURL = c.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
    const link = document.createElement('a');
    link.download = `${doc.name || 'design'}.png`;
    link.href = dataURL;
    link.click();
  }

  function finishPenPath() {
    const c = fcRef.current;
    if (!c || !penPolylineRef.current) return;
    penPolylineRef.current.set({ selectable: true, evented: true });
    penPolylineRef.current = null;
    penPointsRef.current = [];
    addLayer({ name: `Path ${doc.layers.length}`, type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    dispatch({ type: 'SET_TOOL', payload: 'select' });
    saveSnapshot();
  }

  function applyShapeBuilder(_mode: string) {
    const c = fcRef.current;
    if (!c) return;
    const active = c.getActiveObjects();
    if (active.length < 2) return;
    const ids = active.map((o: any) => o.data?.layerId).filter(Boolean);
    if (ids.length > 0) dispatch({ type: 'MERGE_LAYERS', payload: ids });
    saveSnapshot();
    c.renderAll();
  }

  // Expose methods
  useImperativeHandle(ref, () => ({
    finishPenPath, applyShapeBuilder,
    importFile: handleFileImport,
    handleQuickExport: (fmt: string) => exportCanvas(fmt),
    getCanvas: () => fcRef.current,
  }));

  // ---- FILTERS ----
  const applyFilter = useCallback((filterType: string) => {
    const c = fcRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active || !(active as any).type) return;

    const obj = active as any;
    const filterList: any[] = [];

    if (filterType === 'grayscale' && filters.Grayscale) filterList.push(new filters.Grayscale());
    if (filterType === 'sepia' && filters.Sepia) filterList.push(new filters.Sepia());
    if (filterType === 'invert' && filters.Invert) filterList.push(new filters.Invert());
    if (filterType === 'blur' && filters.Blur) filterList.push(new filters.Blur({ blur: 0.5 }));
    if (filterType === 'vintage' && filters.Sepia && filters.Brightness) {
      filterList.push(new filters.Sepia());
      filterList.push(new filters.Brightness({ brightness: 0.05 }));
    }

    if (filterList.length > 0) {
      obj.filters = filterList;
      obj.applyFilters();
      c.renderAll();
      saveSnapshot();
    }
  }, [fcRef, saveSnapshot]);

  // Sync drawing mode
  useEffect(() => {
    const c = fcRef.current;
    if (!c) return;
    if (state.tool !== 'brush' && state.tool !== 'eraser') c.isDrawingMode = false;
    if (c.freeDrawingBrush) {
      c.freeDrawingBrush.color = state.tool === 'eraser' ? doc.canvas.backgroundColor : '#000000';
      c.freeDrawingBrush.width = state.tool === 'brush' ? 5 : state.tool === 'eraser' ? 20 : 5;
    }
  }, [state.tool, doc.canvas.backgroundColor]);

  // Sync canvas size
  useEffect(() => {
    const c = fcRef.current;
    if (!c) return;
    c.setWidth(doc.canvas.width);
    c.setHeight(doc.canvas.height);
    c.backgroundColor = doc.canvas.backgroundColor;
    const bg = c.getObjects().find((o: any) => o.data?.isBackground);
    if (bg) bg.set({ width: doc.canvas.width, height: doc.canvas.height, fill: doc.canvas.backgroundColor });
    c.renderAll();
  }, [doc.canvas.width, doc.canvas.height, doc.canvas.backgroundColor]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1a1a1a', position: 'relative' }} ref={containerRef}>
      {/* Drop hint */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', color: '#555', fontSize: 10, pointerEvents: 'none', zIndex: 5 }}>
        Drop images here · Ctrl+V to paste · Scroll to zoom
      </div>

      {/* Canvas wrapper */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ boxShadow: '0 0 60px rgba(0,0,0,0.6)', borderRadius: 2, overflow: 'hidden' }}>
          <canvas ref={canvasEl} />
        </div>
      </div>

      {/* Pen toolbar */}
      {state.tool === 'pen' && (
        <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', background: '#2a2a2a', borderRadius: 8, padding: '6px 12px', border: '1px solid #7C5CFC', display: 'flex', gap: 8, zIndex: 10 }}>
          <span style={{ fontSize: 11, color: '#ccc', display: 'flex', alignItems: 'center' }}>✎ Pen Tool — Click to add points</span>
          <button onClick={finishPenPath} style={penBtn}>Finish Path</button>
          <button onClick={() => { penPointsRef.current = []; if (penPolylineRef.current && fcRef.current) { fcRef.current.remove(penPolylineRef.current); } penPolylineRef.current = null; dispatch({ type: 'SET_TOOL', payload: 'select' }); }} style={{ ...penBtn, background: '#c0392b' }}>Cancel</button>
        </div>
      )}

      {/* Shape builder toolbar */}
      {state.tool === 'shape-builder' && (
        <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', background: '#2a2a2a', borderRadius: 8, padding: '6px 12px', border: '1px solid #E85D75', display: 'flex', gap: 6, zIndex: 10 }}>
          <span style={{ fontSize: 11, color: '#ccc', display: 'flex', alignItems: 'center', marginRight: 4 }}>Shape Builder</span>
          {(['union', 'subtract', 'intersect'] as const).map(m => (
            <button key={m} onClick={() => applyShapeBuilder(m)} style={penBtn}>
              {m === 'union' ? '∪ Union' : m === 'subtract' ? '− Subtract' : '∩ Intersect'}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 4, background: '#2a2a2a', borderRadius: 8, padding: '4px 8px', border: '1px solid #3a3a3a' }}>
        <button onClick={() => { const c = fcRef.current; if (c) { c.zoomToPoint({ x: c.width! / 2, y: c.height! / 2 }, Math.max(0.05, c.getZoom() / 1.2)); setZoomPct(Math.round(c.getZoom() * 100)); } }} style={zoomBtn}>−</button>
        <button onClick={() => { const c = fcRef.current; if (c) { c.setZoom(1); c.viewportTransform = [1, 0, 0, 1, 0, 0]; c.renderAll(); setZoomPct(100); } }} style={{ ...zoomBtn, minWidth: 50, fontSize: 12 }}>{zoomPct}%</button>
        <button onClick={() => { const c = fcRef.current; if (c) { c.zoomToPoint({ x: c.width! / 2, y: c.height! / 2 }, Math.min(30, c.getZoom() * 1.2)); setZoomPct(Math.round(c.getZoom() * 100)); } }} style={zoomBtn}>+</button>
      </div>

      {/* Canvas size */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, color: '#666', fontSize: 10, fontFamily: 'monospace' }}>
        {doc.canvas.width} × {doc.canvas.height} px
      </div>

      {/* Filter quick bar */}
      {state.tool === 'select' && (
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#2a2a2a', borderRadius: 8, padding: '4px 8px', border: '1px solid #3a3a3a', display: 'flex', gap: 6 }}>
          {[
            { id: 'grayscale', label: 'B&W' },
            { id: 'sepia', label: 'Sepia' },
            { id: 'invert', label: 'Invert' },
            { id: 'blur', label: 'Blur' },
            { id: 'vintage', label: 'Vintage' },
          ].map(f => (
            <button key={f.id} onClick={() => applyFilter(f.id)} style={{ background: 'transparent', border: '1px solid #444', borderRadius: 4, color: '#aaa', cursor: 'pointer', fontSize: 10, padding: '3px 8px' }}>
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default Canvas;

const zoomBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#ccc',
  cursor: 'pointer', fontSize: 16, padding: '4px 8px', borderRadius: 4,
  fontFamily: 'monospace',
};
const penBtn: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 4, border: '1px solid #7C5CFC',
  background: '#7C5CFC33', color: '#fff', cursor: 'pointer', fontSize: 11,
};
