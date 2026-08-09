import React, { useState, useRef, useCallback, useEffect } from 'react';
import Canvas from '../Canvas/Canvas';
import Toolbar from '../Toolbar/Toolbar';
import LayersPanel from '../Panels/LayersPanel';
import AISuggestionsPanel from '../Panels/AISuggestionsPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import ReviewStudio from '../Panels/ReviewStudio';
import CollagePanel from '../Panels/CollagePanel';
import FileMenu from '../Widgets/FileMenu';
import MobileNav from '../Widgets/MobileNav';
import Logo from '../Widgets/Logo';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type Tab = 'layers' | 'review' | 'adjust' | 'collage' | 'ai' | 'export' | 'resize';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'layers', label: 'Layers', color: 'var(--c-purple)' },
  { id: 'review', label: 'Review', color: 'var(--c-teal)' },
  { id: 'adjust', label: 'Adjust', color: 'var(--c-red)' },
  { id: 'collage', label: 'Collage', color: 'var(--c-orange)' },
  { id: 'ai', label: 'AI', color: 'var(--accent)' },
  { id: 'export', label: 'Export', color: 'var(--c-green)' },
  { id: 'resize', label: 'Resize', color: 'var(--c-blue)' },
];

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const [tab, setTab] = useState<Tab>('layers');
  const [mobileTab, setMobileTab] = useState<Tab | null>(null);
  const cr = useRef<any>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { basicMode } = state.globalSettings;

  const cur = state.documents.find(d=>d.id===state.activeDocumentId)||state.documents[0];
  const canUndo = cur.historyIndex>=0, canRedo = cur.historyIndex<cur.history.length-1;

  useEffect(()=>{const c=()=>setIsMobile(window.innerWidth<900);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c)},[]);

  const handleNew = ()=>{dispatch({type:'CREATE_DOCUMENT',payload:{name:`Untitled ${state.documents.length+1}`,width:1080,height:1920}});setShowFileMenu(false);};
  const handleOpen = useCallback(()=>{const i=document.createElement('input');i.type='file';i.accept='.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';i.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f&&cr.current)cr.current.importFile(f)};i.click();setShowFileMenu(false)},[]);
  const handleSave = useCallback(()=>{const c=fabricRef.current;if(!c)return;const a=document.createElement('a');a.download=`${doc.name||'design'}.png`;a.href=c.toDataURL({format:'png',quality:1,multiplier:2});a.click();setShowFileMenu(false)},[fabricRef,doc.name]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--bg-root)'}}>

      {/* ══════ TOP BAR ══════ */}
      <div style={{height:'var(--topbar-h)',background:'var(--bg-surface)',borderBottom:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',padding:'0 10px',gap:0,flexShrink:0,zIndex:100}}>
        <Logo size={24} />

        <div style={{width:1,height:24,background:'var(--border-subtle)',margin:'0 10px'}}/>

        <div style={{position:'relative'}}>
          <button onClick={()=>setShowFileMenu(!showFileMenu)}style={{fontFamily:'var(--font-display)',fontSize:9,fontWeight:700,letterSpacing:1.3,padding:'6px 14px',borderRadius:'var(--radius)',background:showFileMenu?'var(--bg-overlay)':'transparent',color:showFileMenu?'#fff':'var(--text-secondary)',border:showFileMenu?'1px solid var(--border-default)':'1px solid transparent'}}>FILE</button>
          {showFileMenu && <FileMenu onClose={()=>setShowFileMenu(false)} onNew={handleNew} onOpen={handleOpen} onSave={handleSave} onSaveAs={handleSave} onExportPNG={handleSave} onShare={()=>{}} canUndo={canUndo} canRedo={canRedo} onUndo={()=>dispatch({type:'UNDO'})} onRedo={()=>dispatch({type:'REDO'})}/>}
        </div>

        <div style={{width:1,height:24,background:'var(--border-subtle)',margin:'0 10px'}}/>

        <div style={{display:'flex',gap:0,flex:1,overflow:'hidden'}}>
          {state.documents.map(d=>(
            <div key={d.id} onClick={()=>dispatch({type:'SWITCH_DOCUMENT',payload:d.id})}
              style={{padding:'8px 14px',borderRadius:'4px 4px 0 0',fontSize:9,cursor:'pointer',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-display)',fontWeight:600,letterSpacing:.5,background:d.id===state.activeDocumentId?'var(--bg-elevated)':'transparent',color:d.id===state.activeDocumentId?'#fff':'var(--text-muted)',borderBottom:d.id===state.activeDocumentId?'2px solid var(--accent)':'2px solid transparent'}}>
              <span style={{fontSize:7,color:d.isDirty?'var(--c-amber)':'var(--text-disabled)',fontWeight:800}}>{d.isDirty?'●':'○'}</span>
              {d.name}
              {state.documents.length>1&&<span onClick={e=>{e.stopPropagation();dispatch({type:'CLOSE_DOCUMENT',payload:d.id})}}style={{fontSize:13,fontWeight:700,color:'var(--text-disabled)',marginLeft:2}}>×</span>}
            </div>
          ))}
          <button onClick={handleNew}style={{padding:'8px 10px',fontFamily:'var(--font-display)',fontSize:14,fontWeight:300,color:'var(--text-muted)'}}>+</button>
        </div>

        <div style={{width:1,height:24,background:'var(--border-subtle)',margin:'0 10px'}}/>

        <div style={{display:'flex',gap:2,alignItems:'center',flexShrink:0}}>
          <button onClick={()=>dispatch({type:'UNDO'})}disabled={!canUndo}style={tb}title="Undo Ctrl+Z">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button onClick={()=>dispatch({type:'REDO'})}disabled={!canRedo}style={tb}title="Redo Ctrl+Shift+Z">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>

          <div style={{width:1,height:16,background:'var(--border-subtle)',margin:'0 6px'}}/>

          <select value={`${doc.canvas.width}x${doc.canvas.height}`} onChange={e=>{const[w,h]=e.target.value.split('x').map(Number);if(w&&h){dispatch({type:'SET_CANVAS',payload:{width:w,height:h}});saveSnapshot()}}}
            style={{fontFamily:'var(--font-display)',fontSize:8,fontWeight:600,letterSpacing:.5,background:'var(--bg-elevated)',border:'1px solid var(--border-default)',color:'var(--text-secondary)',padding:'5px 24px 5px 8px',borderRadius:'var(--radius)',maxWidth:130}}>
            <option>{doc.canvas.width}×{doc.canvas.height}</option>
            {PLATFORM_PRESETS.filter(p=>p.id!=='custom').slice(0,7).map(p=><option key={p.id} value={`${p.width}x${p.height}`}>{p.platform}: {p.width}×{p.height}</option>)}
          </select>

          <button onClick={handleSave}style={{...tb,color:'var(--c-green)'}}title="Save Ctrl+S">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>

          <div style={{width:1,height:16,background:'var(--border-subtle)',margin:'0 6px'}}/>

          <button onClick={()=>dispatch({type:'SET_BASIC_MODE',payload:!basicMode})}
            style={{fontFamily:'var(--font-display)',fontSize:8,fontWeight:700,letterSpacing:1,color:basicMode?'var(--accent)':'var(--text-muted)',border:basicMode?'1px solid rgba(124,92,252,.3)':'1px solid var(--border-default)',borderRadius:'var(--radius)',padding:'4px 10px',background:basicMode?'var(--accent-glow)':'transparent'}}>
            {basicMode?'BASIC':'ADVANCED'}
          </button>
        </div>
      </div>

      {/* ══════ BODY ══════ */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {!isMobile && <Toolbar/>}
        <Canvas ref={cr}/>

        {!isMobile && (
          <div style={{width:'var(--panel-w)',background:'var(--bg-surface)',borderLeft:'1px solid var(--border-subtle)',display:'flex',flexDirection:'column',flexShrink:0}}>
            <div style={{display:'flex',borderBottom:'1px solid var(--border-subtle)',background:'var(--bg-elevated)',overflowX:'auto'}}>
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{flex:1,padding:'10px 3px',fontFamily:'var(--font-display)',fontSize:7,fontWeight:tab===t.id?800:600,letterSpacing:1.2,background:tab===t.id?'var(--bg-surface)':'transparent',border:'none',borderBottom:tab===t.id?`2px solid ${t.color}`:'2px solid transparent',color:tab===t.id?t.color:'var(--text-disabled)',cursor:'pointer',whiteSpace:'nowrap',transition:'all .1s'}}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{flex:1,overflow:'hidden'}}>
              {tab==='layers'&&<LayersPanel/>}
              {tab==='review'&&<ReviewStudio/>}
              {tab==='adjust'&&<QuickActionsPanel/>}
              {tab==='collage'&&<CollagePanel/>}
              {tab==='ai'&&<AISuggestionsPanel/>}
              {tab==='export'&&<ExportPanel/>}
              {tab==='resize'&&<TemplatesPanel/>}
            </div>
          </div>
        )}
      </div>

      {/* ══════ MOBILE ══════ */}
      {isMobile && <MobileNav tabs={TABS} activeTab={mobileTab} onSelect={(id:any)=>setMobileTab(mobileTab===id?null:id)} onFileMenu={()=>setShowFileMenu(true)}/>}
      {isMobile && mobileTab && (
        <div style={{position:'fixed',inset:0,zIndex:500,background:'var(--bg-surface)',display:'flex',flexDirection:'column',animation:'slideUp .2s ease-out'}}>
          <div className="panel-header"><span className="title">{TABS.find(t=>t.id===mobileTab)?.label}</span><button onClick={()=>setMobileTab(null)}style={{fontSize:16,fontWeight:700,color:'var(--text-muted)'}}>×</button></div>
          <div style={{flex:1,overflow:'hidden'}}>{tab==='layers'&&<LayersPanel/>}{tab==='review'&&<ReviewStudio/>}{tab==='adjust'&&<QuickActionsPanel/>}{tab==='collage'&&<CollagePanel/>}{tab==='ai'&&<AISuggestionsPanel/>}{tab==='export'&&<ExportPanel/>}{tab==='resize'&&<TemplatesPanel/>}</div>
        </div>
      )}

      {/* ══════ STATUS ══════ */}
      <div style={{height:'var(--statusbar-h)',background:'var(--bg-surface)',borderTop:'1px solid var(--border-subtle)',display:'flex',alignItems:'center',padding:'0 14px',gap:18,fontSize:8,flexShrink:0,zIndex:80,fontFamily:'var(--font-display)',fontWeight:600,letterSpacing:.8}}>
        <span style={{color:'var(--text-muted)'}}>TOOL <span style={{color:'var(--text-secondary)'}}>{state.tool.toUpperCase()}</span></span>
        <span style={{color:'var(--text-muted)'}}>LAYERS <span style={{color:'var(--text-secondary)'}}>{doc.layers.length}</span></span>
        <div style={{flex:1}}/>
        <span style={{color:doc.isDirty?'var(--c-amber)':'var(--text-disabled)',fontWeight:700}}>{doc.isDirty?'● UNSAVED':'SAVED'}</span>
        <span style={{color:'var(--text-disabled)',fontSize:7}}>|</span>
        <span style={{color:'var(--text-disabled)',fontSize:7}}>CTRL+S · CTRL+Z · SCROLL · SPACE+PAN · DEL</span>
      </div>
    </div>
  );
}

const tb: React.CSSProperties = { background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', padding:'4px 5px', borderRadius:'var(--radius)', display:'flex', alignItems:'center' };
