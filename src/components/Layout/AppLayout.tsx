import React, { useState, useRef, useCallback, useEffect } from 'react';
import Canvas from '../Canvas/Canvas';
import Toolbar from '../Toolbar/Toolbar';
import LayersPanel from '../Panels/LayersPanel';
import PropertiesPanel from '../Panels/PropertiesPanel';
import AISuggestionsPanel from '../Panels/AISuggestionsPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import ReviewStudio from '../Panels/ReviewStudio';
import CollagePanel from '../Panels/CollagePanel';
import WelcomeModal from '../Widgets/WelcomeModal';
import CollaborationDialog from '../Widgets/CollaborationDialog';
import GradientEditor from '../Widgets/GradientEditor';
import FileMenu from '../Widgets/FileMenu';
import MobileNav from '../Widgets/MobileNav';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type RightTab = 'layers' | 'review' | 'actions' | 'collage' | 'ai' | 'export' | 'resize';

const TABS: { id: RightTab; label: string; color: string }[] = [
  { id: 'layers', label: 'LAYERS', color: 'var(--accent)' },
  { id: 'review', label: 'REVIEW', color: 'var(--accent3)' },
  { id: 'actions', label: 'ADJUST', color: 'var(--accent2)' },
  { id: 'collage', label: 'COLLAGE', color: 'var(--accent6)' },
  { id: 'ai', label: 'AI', color: 'var(--accent5)' },
  { id: 'export', label: 'EXPORT', color: 'var(--info)' },
  { id: 'resize', label: 'RESIZE', color: 'var(--accent3)' },
];

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const [rightTab, setRightTab] = useState<RightTab>('layers');
  const [mobileTab, setMobileTab] = useState<RightTab | null>(null);
  const canvasRef = useRef<any>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showGradient, setShowGradient] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { basicMode } = state.globalSettings;

  const currentDoc = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];
  const canUndo = currentDoc.historyIndex >= 0;
  const canRedo = currentDoc.historyIndex < currentDoc.history.length - 1;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/photo/sw.js').catch(() => {});
  }, []);

  const handleNewDoc = () => {
    dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Untitled ${state.documents.length + 1}`, width: 1200, height: 800 } });
    setShowFileMenu(false);
  };

  const handleOpenFile = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file';
    input.accept = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';
    input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file && canvasRef.current) canvasRef.current.importFile(file); };
    input.click(); setShowFileMenu(false);
  }, []);

  const handleSave = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = `${doc.name || 'design'}.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1 }); a.click(); setShowFileMenu(false);
  }, [fabricRef, doc.name]);

  const handleSaveAs = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = `${doc.name || 'design'}_2x.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }); a.click(); setShowFileMenu(false);
  }, [fabricRef, doc.name]);

  const handleExportPNG = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = `${doc.name || 'design'}.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }); a.click(); setShowFileMenu(false);
  }, [fabricRef, doc.name]);

  const handleWelcomeStart = (w: number, h: number) => {
    dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } });
    saveSnapshot(); setShowWelcome(false);
  };

  const renderPanel = () => {
    switch (rightTab) {
      case 'layers': return <LayersPanel />;
      case 'review': return <ReviewStudio />;
      case 'actions': return <QuickActionsPanel />;
      case 'collage': return <CollagePanel />;
      case 'ai': return <AISuggestionsPanel />;
      case 'export': return <ExportPanel />;
      case 'resize': return <TemplatesPanel />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-root)' }}>
      {showWelcome && <WelcomeModal onStart={handleWelcomeStart} onClose={() => setShowWelcome(false)} />}
      {showShare && <CollaborationDialog projectName={doc.name} onClose={() => setShowShare(false)} />}
      {showGradient && <GradientEditor onApply={() => { setShowGradient(false); saveSnapshot(); }} onClose={() => setShowGradient(false)} />}

      {/* ═══════════ TOP BAR ═══════════ */}
      <div style={{
        height: 'var(--topbar-h)', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 0,
        flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent)', marginRight: 8, userSelect: 'none' }}>
          DESIGN<span style={{ fontWeight: 300, color: 'var(--text-muted)', fontSize: 11 }}>EDITOR</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'var(--border-default)', margin: '0 12px' }} />

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFileMenu(!showFileMenu)}
            style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: '6px 14px', borderRadius: 'var(--radius)', background: showFileMenu ? 'var(--bg-overlay)' : 'transparent', color: showFileMenu ? '#fff' : 'var(--text-secondary)', border: showFileMenu ? '1px solid var(--border-default)' : '1px solid transparent' }}>
            FILE
          </button>
          {showFileMenu && <FileMenu onClose={() => setShowFileMenu(false)} onNew={handleNewDoc} onOpen={handleOpenFile} onSave={handleSave} onSaveAs={handleSaveAs} onExportPNG={handleExportPNG} onShare={() => { setShowShare(true); setShowFileMenu(false); }} canUndo={canUndo} canRedo={canRedo} onUndo={() => dispatch({ type: 'UNDO' })} onRedo={() => dispatch({ type: 'REDO' })} />}
        </div>

        <div style={{ width: 1, height: 26, background: 'var(--border-default)', margin: '0 12px' }} />

        <div style={{ display: 'flex', gap: 0, flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {state.documents.map(d => (
            <div key={d.id} onClick={() => dispatch({ type: 'SWITCH_DOCUMENT', payload: d.id })}
              style={{ padding: '9px 14px', borderRadius: '4px 4px 0 0', fontSize: 9, cursor: 'pointer', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 0.5, background: d.id === state.activeDocumentId ? 'var(--bg-elevated)' : 'transparent', color: d.id === state.activeDocumentId ? '#fff' : 'var(--text-muted)', borderBottom: d.id === state.activeDocumentId ? '2px solid var(--accent)' : '2px solid transparent' }}>
              <span style={{ fontSize: 7, color: d.isDirty ? 'var(--warning)' : 'var(--text-disabled)', fontWeight: 800 }}>{d.isDirty ? '●' : '○'}</span>
              {d.name}
              {state.documents.length > 1 && <span onClick={e => { e.stopPropagation(); dispatch({ type: 'CLOSE_DOCUMENT', payload: d.id }); }} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-disabled)', marginLeft: 2 }}>×</span>}
            </div>
          ))}
          <button onClick={handleNewDoc} style={{ padding: '8px 10px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 300, color: 'var(--text-muted)' }}>+</button>
        </div>

        <div style={{ width: 1, height: 26, background: 'var(--border-default)', margin: '0 12px' }} />

        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} style={topBtn} title="Undo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} style={topBtn} title="Redo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>

          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 6px' }} />

          <select value={`${doc.canvas.width}x${doc.canvas.height}`} onChange={e => { const [w,h] = e.target.value.split('x').map(Number); if(w&&h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); } }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 600, letterSpacing: 0.5, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', padding: '5px 24px 5px 8px', borderRadius: 'var(--radius)', maxWidth: 120 }}>
            <option>{doc.canvas.width}×{doc.canvas.height}</option>
            {PLATFORM_PRESETS.filter(p => p.id !== 'custom').slice(0, 6).map(p => <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform}: {p.width}×{p.height}</option>)}
          </select>

          <button onClick={handleSave} style={{ ...topBtn, color: 'var(--success)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
          <button onClick={() => setShowShare(true)} style={{ ...topBtn, color: 'var(--info)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>

          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 6px' }} />

          <button onClick={() => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode })}
            style={{ fontFamily: 'var(--font-display)', fontSize: 8, fontWeight: 700, letterSpacing: 1, color: basicMode ? 'var(--accent)' : 'var(--text-muted)', border: basicMode ? '1px solid rgba(124,92,252,0.3)' : '1px solid var(--border-default)', borderRadius: 'var(--radius)', padding: '4px 10px', background: basicMode ? 'rgba(124,92,252,0.08)' : 'transparent' }}>
            {basicMode ? 'BASIC' : 'ADVANCED'}
          </button>
        </div>
      </div>

      {/* ═══════════ MAIN BODY ═══════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!isMobile && <Toolbar />}
        <Canvas ref={canvasRef} />

        {!isMobile && (
          <div style={{ width: 'var(--panel-w)', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', overflowX: 'auto' }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setRightTab(tab.id)}
                  style={{ flex: 1, padding: '10px 3px', fontFamily: 'var(--font-display)', fontSize: 7, fontWeight: rightTab === tab.id ? 800 : 600, letterSpacing: 1.2, background: rightTab === tab.id ? 'var(--bg-surface)' : 'transparent', border: 'none', borderBottom: rightTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent', color: rightTab === tab.id ? tab.color : 'var(--text-disabled)', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.1s' }}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{renderPanel()}</div>
          </div>
        )}
      </div>

      {isMobile && <MobileNav tabs={TABS} activeTab={mobileTab} onSelect={(id: any) => setMobileTab(mobileTab === id ? null : id)} onFileMenu={() => setShowFileMenu(true)} />}

      {/* ═══════════ STATUS BAR ═══════════ */}
      <div style={{ height: 'var(--statusbar-h)', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16, fontSize: 8, flexShrink: 0, zIndex: 80, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: 0.8 }}>
        <span style={{ color: 'var(--text-muted)' }}>TOOL <span style={{ color: 'var(--text-secondary)' }}>{state.tool.toUpperCase()}</span></span>
        <span style={{ color: 'var(--text-muted)' }}>LAYERS <span style={{ color: 'var(--text-secondary)' }}>{doc.layers.length}</span></span>
        <div style={{ flex: 1 }} />
        <span style={{ color: doc.isDirty ? 'var(--warning)' : 'var(--text-disabled)', fontWeight: 700 }}>{doc.isDirty ? '● UNSAVED' : 'SAVED'}</span>
        <span style={{ color: 'var(--text-disabled)', fontSize: 7 }}>|</span>
        <span style={{ color: 'var(--text-disabled)', fontSize: 7 }}>CTRL+S SAVE · CTRL+Z UNDO · SCROLL ZOOM · SPACE PAN</span>
      </div>
    </div>
  );
}

const topBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 5px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center' };
