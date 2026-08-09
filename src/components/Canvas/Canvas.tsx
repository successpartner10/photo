import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useEditor } from '../../store/editorStore';

const Canvas = forwardRef<any, {}>((_props, ref) => {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<any>(null);
  const { state, dispatch, doc, fabricRef, saveSnapshot, addLayer } = useEditor();
  const isDrawingRef = useRef<string | null>(null);
  const penPts = useRef<{x:number;y:number}[]>([]);
  const penPoly = useRef<any>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [loading, setLoading] = useState(true);

  function uid(p: string) { return `${p}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`; }

  const fitImageToCanvas = useCallback((imgW:number, imgH:number) => {
    const cw = doc.canvas.width, ch = doc.canvas.height;
    const scale = Math.min((cw * 0.88) / imgW, (ch * 0.88) / imgH, 1);
    return { w: imgW * scale, h: imgH * scale, scale };
  }, [doc.canvas.width, doc.canvas.height]);

  /* ── INIT fabric dynamically ── */
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
        perPixelTargetFind: true, targetFindTolerance: 4,
      });
      fcRef.current = c;
      fabricRef.current = c;
      if (typeof ref === 'function') ref(c); else if (ref) (ref as any).current = c;
      setLoading(false);

      c.on('selection:created', saveSnapshot);
      c.on('selection:updated', saveSnapshot);
      c.on('object:modified', saveSnapshot);

      /* zoom */
      c.on('mouse:wheel', (opt:any) => {
        const d = opt.e.deltaY, z = Math.min(30, Math.max(0.05, c.getZoom() * 0.999 ** d));
        c.zoomToPoint({ x:opt.e.offsetX, y:opt.e.offsetY }, z);
        setZoomPct(Math.round(z * 100));
        opt.e.preventDefault(); opt.e.stopPropagation();
      });

      /* pan */
      let panning = false;
      c.on('mouse:down', (opt:any) => {
        if (opt.e.button === 1 || (opt.e.altKey && opt.e.button === 0)) { panning = true; c.selection = false; }
      });
      c.on('mouse:move', (opt:any) => {
        if (panning) { const v = c.viewportTransform!; v[4] += opt.e.movementX||0; v[5] += opt.e.movementY||0; c.requestRenderAll(); }
      });
      c.on('mouse:up', () => { panning = false; c.selection = true; });

      /* ── DRAWING ── */
      function handleMD(o:any) {
        if (panning) return;
        const p = c.getScenePoint(o.e), t = state.tool;
        if (t==='brush'||t==='eraser') { c.isDrawingMode=true; if(c.freeDrawingBrush){c.freeDrawingBrush.color=t==='eraser'?doc.canvas.backgroundColor:'#000';c.freeDrawingBrush.width=t==='brush'?6:24} return; }
        c.isDrawingMode = false;
        if (t==='rect') { const r = new Rect({left:p.x,top:p.y,width:1,height:1,fill:'#4A90D9',stroke:'#1a1a1a',strokeWidth:2}); (r as any).__draw={sx:p.x,sy:p.y}; c.add(r);c.setActiveObject(r); isDrawingRef.current='rect'; }
        else if (t==='ellipse') { const e = new Ellipse({left:p.x,top:p.y,rx:1,ry:1,fill:'#E85D75',stroke:'#1a1a1a',strokeWidth:2}); (e as any).__draw={sx:p.x,sy:p.y}; c.add(e);c.setActiveObject(e); isDrawingRef.current='ellipse'; }
        else if (t==='line') { const l = new Line([p.x,p.y,p.x,p.y],{stroke:'#333',strokeWidth:3}); (l as any).__draw={sx:p.x,sy:p.y}; c.add(l);c.setActiveObject(l); isDrawingRef.current='line'; }
        else if (t==='text') { const tx = new IText('Type here',{left:p.x,top:p.y,fontFamily:'system-ui, sans-serif',fontSize:36,fill:'#fff'}); c.add(tx);c.setActiveObject(tx); addLayer({name:'Text',type:'text',visible:true,locked:false,opacity:1,blendMode:'normal',isGroup:false}); dispatch({type:'SET_TOOL',payload:'select'}); saveSnapshot(); }
        else if (t==='pen') {
          if (!penPoly.current) { const pp = new Polyline([],{fill:'transparent',stroke:'#8b5cf6',strokeWidth:3,selectable:false,evented:false}); c.add(pp); penPoly.current=pp; penPts.current=[]; }
          penPts.current.push({x:p.x,y:p.y}); penPoly.current.set({points:[...penPts.current]}); c.renderAll();
        }
      }
      function handleMM(o:any) {
        if (!isDrawingRef.current) return;
        const p = c.getScenePoint(o.e), obj = c.getActiveObject(); if(!obj) return;
        if (isDrawingRef.current==='rect') { const d=(obj as any).__draw,w=p.x-d.sx,h=p.y-d.sy; obj.set({width:Math.abs(w),height:Math.abs(h),left:w>0?d.sx:p.x,top:h>0?d.sy:p.y}); }
        else if (isDrawingRef.current==='ellipse') { const d=(obj as any).__draw; obj.set({rx:Math.abs(p.x-d.sx)/2,ry:Math.abs(p.y-d.sy)/2,left:Math.min(d.sx,p.x),top:Math.min(d.sy,p.y)}); }
        else if (isDrawingRef.current==='line') obj.set({x2:p.x,y2:p.y});
        c.renderAll();
      }
      function handleMU(_:any) {
        if (isDrawingRef.current) { const n = isDrawingRef.current==='rect'?'Rect':isDrawingRef.current==='ellipse'?'Ellipse':'Line'; addLayer({name:`${n}`,type:'vector',visible:true,locked:false,opacity:1,blendMode:'normal',isGroup:false}); saveSnapshot(); isDrawingRef.current=null; dispatch({type:'SET_TOOL',payload:'select'}); }
      }
      function handleDel() { c.getActiveObjects().forEach((o:any)=>c.remove(o)); c.discardActiveObject();c.renderAll();saveSnapshot(); }

      c.on('mouse:down', handleMD);
      c.on('mouse:move', handleMM);
      c.on('mouse:up', handleMU);

      /* keyboard */
      const k = (e:KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
        const ctrl = e.ctrlKey||e.metaKey;
        if (ctrl && e.key==='z' && !e.shiftKey) { e.preventDefault(); dispatch({type:'UNDO'}); }
        if (ctrl && ((e.key==='z' && e.shiftKey) || e.key==='y')) { e.preventDefault(); dispatch({type:'REDO'}); }
        if (e.key==='Delete'||e.key==='Backspace') handleDel();
        if (e.key==='Escape') { c.discardActiveObject(); c.renderAll(); }
        if (!ctrl) {
          const m: Record<string,any> = {v:'select',m:'move',r:'rect',e:'ellipse',l:'line',t:'text',p:'pen',b:'brush',g:'fill',w:'magic-wand',s:'clone',h:'healing',u:'shape-builder'};
          const t2 = m[e.key.toLowerCase()];
          if(t2){e.preventDefault();dispatch({type:'SET_TOOL',payload:t2})}
        }
      };
      window.addEventListener('keydown',k);
      (c as any).__k = k;

      /* bg */
      const bg = new Rect({width:doc.canvas.width,height:doc.canvas.height,fill:doc.canvas.backgroundColor,selectable:false,evented:false,excludeFromExport:true});
      (bg as any).data = {isBackground:true};
      c.add(bg); c.renderAll();

      /* DnD */
      const el = canvasEl.current!;
      const dgo = (e:DragEvent)=>{e.preventDefault();e.dataTransfer!.dropEffect='copy'};
      const dg = (e:DragEvent)=>{e.preventDefault();const f=e.dataTransfer?.files?.[0];if(f)handleFileImport(f,c)};
      el.addEventListener('dragover',dgo);el.addEventListener('drop',dg);
      (c as any).__dnd = ()=>{el.removeEventListener('dragover',dgo);el.removeEventListener('drop',dg)};

      /* ── IMPORT ── */
      async function handleFileImport(file:File, cc?:any) {
        const canvas2 = cc || c; if(!canvas2) return;
        const reader = new FileReader();
        reader.onload = async e2 => {
          const dataUrl = e2.target?.result as string;
          const img = await new Promise<HTMLImageElement>(r=>{const i=new Image();i.onload=()=>r(i);i.src=dataUrl});
          const {w:hW,h:hH} = fitImageToCanvas(img.width, img.height);
          const fImg = new FabricImage(img, {
            left: (doc.canvas.width - hW) / 2, top: (doc.canvas.height - hH) / 2,
            scaleX: hW / img.width, scaleY: hH / img.height,
          });
          (fImg as any).data = {layerId:uid('import'),isSourceImage:true};
          (fImg as any)._htmlImageElement = img;
          canvas2.add(fImg); canvas2.setActiveObject(fImg); canvas2.renderAll();
          addLayer({name:file.name||'Import',type:'raster',visible:true,locked:false,opacity:1,blendMode:'normal',isGroup:false});
          saveSnapshot();
        };
        reader.readAsDataURL(file);
      }

      (c as any).importFile = (file: File) => handleFileImport(file, c);

      /* filters */
      (c as any).applyFilter = (ft:string) => {
        c.getObjects().forEach((o:any)=>{if(o.data?.isBackground||o.data?.isCheckerboard)return;if(!o.filters)o.filters=[];
          if(ft==='grayscale'&&filters.Grayscale)o.filters.push(new filters.Grayscale());
          else if(ft==='sepia'&&filters.Sepia)o.filters.push(new filters.Sepia());
          else if(ft==='invert'&&filters.Invert)o.filters.push(new filters.Invert());
          else if(ft==='blur'&&filters.Blur)o.filters.push(new filters.Blur({blur:.5}));
          o.applyFilters();
        });
        c.renderAll();saveSnapshot();
      };
    });

    return () => {
      disposed = true;
      const cc = fcRef.current;
      if (cc) { if ((cc as any).__k) window.removeEventListener('keydown',(cc as any).__k); if ((cc as any).__dnd) (cc as any).__dnd(); cc.dispose(); fcRef.current=null; fabricRef.current=null; }
    };
  }, []);

  /* sync tool */
  useEffect(()=>{const c=fcRef.current;if(!c)return;if(state.tool!=='brush'&&state.tool!=='eraser')c.isDrawingMode=false;if(c.freeDrawingBrush){c.freeDrawingBrush.color=state.tool==='eraser'?doc.canvas.backgroundColor:'#000';c.freeDrawingBrush.width=state.tool==='brush'?6:24}},[state.tool,doc.canvas.backgroundColor]);

  /* sync size */
  useEffect(()=>{const c=fcRef.current;if(!c)return;c.setWidth(doc.canvas.width);c.setHeight(doc.canvas.height);c.backgroundColor=doc.canvas.backgroundColor;const bg=c.getObjects().find((o:any)=>o.data?.isBackground);if(bg)bg.set({width:doc.canvas.width,height:doc.canvas.height,fill:doc.canvas.backgroundColor});c.renderAll()},[doc.canvas.width,doc.canvas.height,doc.canvas.backgroundColor]);

  /* ── FILTER ── */
  const applyFilter = useCallback((ft:string)=>{
    const c=fcRef.current;if(!c||!(c as any).applyFilter)return;(c as any).applyFilter(ft);
  },[fcRef]);

  function finishPen() {
    const c=fcRef.current;if(!c||!penPoly.current)return;
    penPoly.current.set({selectable:true,evented:true});penPoly.current=null;penPts.current=[];
    addLayer({name:'Path',type:'vector',visible:true,locked:false,opacity:1,blendMode:'normal',isGroup:false});
    dispatch({type:'SET_TOOL',payload:'select'});saveSnapshot();
  }

  function handleSave() { const c=fcRef.current;if(!c)return;const a=document.createElement('a');a.download=`${doc.name||'design'}.png`;a.href=c.toDataURL({format:'png',quality:1,multiplier:2});a.click(); }

  useImperativeHandle(ref,()=>({finishPen,importFile:(f:File)=>fcRef.current?.importFile?.(f),handleQuickSave:handleSave,getCanvas:()=>fcRef.current}));

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:'var(--bg-root)',position:'relative'}} ref={containerRef}>
      {loading && (
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-root)',zIndex:50,flexDirection:'column',gap:12}}>
          <div style={{fontSize:24,fontWeight:800,color:'var(--accent)',fontFamily:'var(--font-display)'}}>Inkception</div>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>Loading canvas engine...</div>
        </div>
      )}
      <div style={{flex:1,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{boxShadow:'0 0 80px rgba(0,0,0,0.7)',borderRadius:2,overflow:'hidden'}}>
          <canvas ref={canvasEl}/>
        </div>
      </div>
      {state.tool==='pen'&&(
        <div style={{position:'absolute',top:44,left:'50%',transform:'translateX(-50%)',background:'var(--bg-overlay)',borderRadius:8,padding:'8px 14px',border:'1px solid var(--c-purple)',display:'flex',gap:8,zIndex:10}}>
          <span style={{fontSize:10,color:'var(--text-secondary)',fontFamily:'var(--font-display)',fontWeight:600,display:'flex',alignItems:'center'}}>PEN — Click to add points</span>
          <button onClick={finishPen} className="btn btn-primary" style={{padding:'4px 12px',fontSize:9}}>FINISH</button>
          <button onClick={()=>{penPts.current=[];if(penPoly.current&&fcRef.current)fcRef.current.remove(penPoly.current);penPoly.current=null;dispatch({type:'SET_TOOL',payload:'select'});}} className="btn btn-danger" style={{padding:'4px 12px',fontSize:9}}>CANCEL</button>
        </div>
      )}
      <div style={{position:'absolute',bottom:14,right:14,display:'flex',alignItems:'center',gap:4,background:'var(--bg-overlay)',borderRadius:8,padding:'4px 8px',border:'1px solid var(--border-default)'}}>
        <button onClick={()=>{const c=fcRef.current;if(c){c.zoomToPoint({x:c.width!/2,y:c.height!/2},Math.max(.05,c.getZoom()/1.2));setZoomPct(Math.round(c.getZoom()*100))}}} style={zBtn}>−</button>
        <button onClick={()=>{const c=fcRef.current;if(c){c.setZoom(1);c.viewportTransform=[1,0,0,1,0,0];c.renderAll();setZoomPct(100)}}} style={{...zBtn,minWidth:46,fontSize:10,fontFamily:'var(--font-display)',fontWeight:700}}>{zoomPct}%</button>
        <button onClick={()=>{const c=fcRef.current;if(c){c.zoomToPoint({x:c.width!/2,y:c.height!/2},Math.min(30,c.getZoom()*1.2));setZoomPct(Math.round(c.getZoom()*100))}}} style={zBtn}>+</button>
      </div>
      <div style={{position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',background:'var(--bg-overlay)',borderRadius:8,padding:'4px 6px',border:'1px solid var(--border-default)',display:'flex',gap:4}}>
        {[{id:'grayscale',l:'B&W'},{id:'sepia',l:'Sepia'},{id:'invert',l:'Invert'},{id:'blur',l:'Blur'}].map(f=>(
          <button key={f.id} onClick={()=>applyFilter(f.id)} style={{background:'transparent',border:'1px solid var(--border-default)',borderRadius:4,color:'var(--text-secondary)',cursor:'pointer',fontSize:9,padding:'3px 8px',fontFamily:'var(--font-display)',fontWeight:600}}>{f.l}</button>
        ))}
      </div>
    </div>
  );
});

export default Canvas;
const zBtn:React.CSSProperties = {background:'transparent',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:16,padding:'4px 8px',borderRadius:4,fontFamily:'monospace'};
