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
import MegaMenu from '../Widgets/MegaMenu';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type Tab = 'layers' | 'adjust' | 'ai' | 'collage' | 'preview' | 'resize' | 'export';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'layers', label: 'Layers', color: 'var(--accent)' },
  { id: 'adjust', label: 'Adjust', color: 'var(--accent2)' },
  { id: 'ai', label: 'AI', color: 'var(--green)' },
  { id: 'collage', label: 'Collage', color: 'var(--amber)' },
  { id: 'preview', label: 'Preview', color: '#8b5cf6' },
  { id: 'resize', label: 'Resize', color: '#60a5fa' },
  { id: 'export', label: 'Export', color: 'var(--green)' },
];

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef } = useEditor();
  const [tab, setTab] = useState<Tab>('layers');
  const [mobilePanel, setMobilePanel] = useState<Tab | null>(null);
  const cr = useRef<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [uploading, setUploading] = useState('');
  const { basicMode } = state.globalSettings;

  const cur = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];
  const canUndo = cur.historyIndex >= 0;
  const canRedo = cur.historyIndex < cur.history.length - 1;

  useEffect(() => {
    const ck = () => setIsDesktop(window.innerWidth >= 1024);
    ck(); window.addEventListener('resize', ck);
    return () => window.removeEventListener('resize', ck);
  }, []);

  const handleNew = () => { dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Untitled ${state.documents.length + 1}`, width: 1080, height: 1920 } }); setActiveMenu(null); };
  const handleOpen = useCallback(() => {
    const i = document.createElement('input'); i.type = 'file';
    i.accept = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';
    i.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      setUploading(f.name);
      if (cr.current) cr.current.importFile(f);
      setTimeout(() => setUploading(''), 1800);
    };
    i.click(); setActiveMenu(null);
  }, []);
  const handleSave = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const a = document.createElement('a'); a.download = `${doc.name || 'design'}.png`;
    a.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 }); a.click();
    setActiveMenu(null);
  }, [fabricRef, doc.name]);

  const fileMenu = {
    title: 'FILE',
    items: [
      { label: 'New Project', shortcut: 'Ctrl+N', icon: '📄', onClick: handleNew },
      { label: 'Open File...', shortcut: 'Ctrl+O', icon: '📂', onClick: handleOpen },
      { label: 'div' as any },
      { label: 'Save', shortcut: 'Ctrl+S', icon: '💾', onClick: handleSave },
      { label: 'Save As (2x)', shortcut: 'Ctrl+Shift+S', icon: '📥', onClick: handleSave },
      { label: 'Export PNG', shortcut: 'Ctrl+E', icon: '🖼', onClick: handleSave },
    ],
  };

  const editMenu = {
    title: 'EDIT',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z', icon: '↩', disabled: !canUndo, onClick: () => dispatch({ type: 'UNDO' }) },
      { label: 'Redo', shortcut: 'Ctrl+Shift+Z', icon: '↪', disabled: !canRedo, onClick: () => dispatch({ type: 'REDO' }) },
    ],
  };

  const viewMenu = {
    title: 'VIEW',
    items: [
      { label: basicMode ? 'Advanced Mode' : 'Basic Mode', icon: basicMode ? '🔓' : '🔒', onClick: () => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode }) },
    ],
  };

  const megaColumns = [fileMenu, editMenu, viewMenu];

  const renderPanel = () => {
    switch (tab) {
      case 'layers': return <LayersPanel />;
      case 'preview': return <ReviewStudio />;
      case 'adjust': return <QuickActionsPanel />;
      case 'collage': return <CollagePanel />;
      case 'ai': return <AISuggestionsPanel />;
      case 'export': return <ExportPanel />;
      case 'resize': return <TemplatesPanel />;
    }
  };

  const renderMobilePanelContent = (id: Tab) => {
    switch (id) {
      case 'layers': return <LayersPanel />;
      case 'preview': return <ReviewStudio />;
      case 'adjust': return <QuickActionsPanel />;
      case 'collage': return <CollagePanel />;
      case 'ai': return <AISuggestionsPanel />;
      case 'export': return <ExportPanel />;
      case 'resize': return <TemplatesPanel />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      {/* ════════════ NAV BAR ════════════ */}
      <div style={{
        height: 'var(--nav-h)', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 0,
        flexShrink: 0, zIndex: 200, paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: 'var(--font)', fontSize: 18, fontWeight: 800, color: '#fff',
          marginRight: 20, letterSpacing: -.5, userSelect: 'none',
        }}>
          <span style={{ color: 'var(--accent)' }}>ink</span>ception
        </div>

        {/* Desktop mega menus */}
        {isDesktop && (
          <>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setActiveMenu(activeMenu === 'mega' ? null : 'mega')}
                style={{
                  padding: '10px 16px', fontSize: 14, fontWeight: 600,
                  color: activeMenu === 'mega' ? '#fff' : 'var(--text2)',
                  background: activeMenu === 'mega' ? 'var(--elevated)' : 'transparent',
                  borderRadius: 'var(--radius)',
                }}>
                Menu ▾
              </button>
              {activeMenu === 'mega' && (
                <MegaMenu columns={megaColumns} onClose={() => setActiveMenu(null)} />
              )}
            </div>

            <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 12px' }} />

            {/* Document tabs */}
            <div style={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden', minWidth: 0 }}>
              {state.documents.map(d => (
                <div key={d.id} onClick={() => dispatch({ type: 'SWITCH_DOCUMENT', payload: d.id })}
                  style={{
                    padding: '10px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    borderRadius: 'var(--radius) var(--radius) 0 0', maxWidth: 150,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: d.id === state.activeDocumentId ? 'var(--elevated)' : 'transparent',
                    color: d.id === state.activeDocumentId ? '#fff' : 'var(--text2)',
                    borderBottom: d.id === state.activeDocumentId ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                  <span style={{ fontSize: 10, color: d.isDirty ? 'var(--amber)' : 'var(--green)', fontWeight: 800 }}>
                    {d.isDirty ? '●' : '○'}
                  </span>
                  {d.name}
                  {state.documents.length > 1 && (
                    <span onClick={e => { e.stopPropagation(); dispatch({ type: 'CLOSE_DOCUMENT', payload: d.id }); }}
                      style={{ fontSize: 15, color: 'var(--text3)', marginLeft: 4, fontWeight: 700 }}>×</span>
                  )}
                </div>
              ))}
              <button onClick={() => dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Untitled ${state.documents.length + 1}`, width: 1080, height: 1920 } })}
                style={{ padding: '8px 12px', fontSize: 18, fontWeight: 300, color: 'var(--text3)' }}>
                +
              </button>
            </div>

            <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 12px' }} />

            {/* Quick toolbar */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
                style={{ padding: '8px 12px', fontSize: 16, fontWeight: 700, color: canUndo ? 'var(--text2)' : 'var(--text3)', borderRadius: 'var(--radius)' }} title="Undo">
                ↩
              </button>
              <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
                style={{ padding: '8px 12px', fontSize: 16, fontWeight: 700, color: canRedo ? 'var(--text2)' : 'var(--text3)', borderRadius: 'var(--radius)' }} title="Redo">
                ↪
              </button>

              <select value={`${doc.canvas.width}x${doc.canvas.height}`}
                onChange={e => { const [w, h] = e.target.value.split('x').map(Number); if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); } }}
                style={{ fontSize: 11, fontWeight: 600, background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 24px 6px 10px', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                <option>{doc.canvas.width}×{doc.canvas.height}</option>
                {PLATFORM_PRESETS.filter(p => p.id !== 'custom').map(p => <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform} {p.width}×{p.height}</option>)}
              </select>

              <button onClick={handleSave}
                style={{ padding: '8px 16px', fontSize: 14, fontWeight: 700, color: '#fff', background: 'var(--green)', borderRadius: 'var(--radius)' }} title="Save">
                Save
              </button>
            </div>
          </>
        )}

        {/* Mobile hamburger */}
        {!isDesktop && (
          <>
            <button onClick={() => setActiveMenu(activeMenu === 'mega' ? null : 'mega')}
              style={{ padding: '10px 14px', fontSize: 20, fontWeight: 700, color: '#fff', borderRadius: 'var(--radius)' }}>
              ☰
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={handleSave}
              style={{ padding: '10px 20px', fontSize: 14, fontWeight: 700, color: '#000', background: 'var(--green)', borderRadius: 'var(--radius)' }}>
              Save
            </button>
          </>
        )}
      </div>

      {/* Mobile mega menu overlay */}
      {!isDesktop && activeMenu === 'mega' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex' }}>
          <div onClick={() => setActiveMenu(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)' }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 300, maxWidth: '85vw',
            background: 'var(--elevated)', overflow: 'auto', animation: 'slideRight .15s ease-out',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                <span style={{ color: 'var(--accent)' }}>ink</span>ception
              </span>
              <button onClick={() => setActiveMenu(null)} style={{ fontSize: 24, fontWeight: 700, color: 'var(--text3)', padding: '4px 8px' }}>×</button>
            </div>
            {megaColumns.map(col => (
              <div key={col.title}>
                <div style={{ padding: '10px 16px 6px', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text3)', textTransform: 'uppercase' }}>{col.title}</div>
                {col.items.map(item => item.label === 'div' ? <div key="d" style={{ height: 1, background: 'var(--border)', margin: '4px 12px' }} /> : (
                  <button key={item.label}
                    onClick={() => { if (!item.disabled) { item.onClick(); setActiveMenu(null); } }}
                    disabled={item.disabled}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '14px 16px', fontSize: 14, fontWeight: 500,
                      color: item.disabled ? 'var(--text3)' : item.danger ? 'var(--red)' : 'var(--text)',
                      borderRadius: 0, textAlign: 'left',
                    }}>
                    {item.icon && <span style={{ fontSize: 18 }}>{item.icon}</span>}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.shortcut && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.shortcut}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload toast */}
      {uploading && (
        <div style={{ position: 'fixed', top: 'var(--nav-h)', left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'var(--accent)', color: '#fff', padding: '8px 20px', borderRadius: '0 0 var(--radius) var(--radius)', fontSize: 13, fontWeight: 600 }}>
          Importing: {uploading}
        </div>
      )}

      {/* ════════════ MAIN BODY ════════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isDesktop && <Toolbar />}
        <Canvas ref={cr} />

        {/* Desktop right panel */}
        {isDesktop && (
          <div style={{
            width: 'var(--panel-w)', background: 'var(--surface)',
            borderLeft: '1px solid var(--border)', display: 'flex',
            flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', background: 'var(--elevated)',
              borderBottom: '1px solid var(--border)', overflowX: 'auto',
              height: 40, alignItems: 'stretch',
            }}>
              {TABS.map(t => (
                <button key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '0 14px', fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
                    letterSpacing: .5, whiteSpace: 'nowrap',
                    color: tab === t.id ? t.color : 'var(--text3)',
                    borderBottom: tab === t.id ? `3px solid ${t.color}` : '3px solid transparent',
                    borderRadius: 0, background: 'transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{renderPanel()}</div>
          </div>
        )}
      </div>

      {/* ════════════ MOBILE BOTTOM BAR ════════════ */}
      {!isDesktop && (
        <div style={{
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 100,
        }}>
          {/* Quick actions row */}
          <div style={{ display: 'flex', gap: 4, padding: '6px 8px' }}>
            <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
              style={{ flex: 1, padding: '10px', fontSize: 18, fontWeight: 700, color: canUndo ? 'var(--text2)' : 'var(--text3)', background: 'var(--elevated)', borderRadius: 'var(--radius)' }}>
              ↩
            </button>
            <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
              style={{ flex: 1, padding: '10px', fontSize: 18, fontWeight: 700, color: canRedo ? 'var(--text2)' : 'var(--text3)', background: 'var(--elevated)', borderRadius: 'var(--radius)' }}>
              ↪
            </button>
            <select value={`${doc.canvas.width}x${doc.canvas.height}`}
              onChange={e => { const [w, h] = e.target.value.split('x').map(Number); if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); } }}
              style={{ flex: 2, fontSize: 11, fontWeight: 600, background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 'var(--radius)', textAlign: 'center', padding: '10px' }}>
              <option>{doc.canvas.width}×{doc.canvas.height}</option>
              {PLATFORM_PRESETS.slice(0, 6).map(p => <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform} {p.width}×{p.height}</option>)}
            </select>
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', gap: 2, padding: '0 6px 6px' }}>
            {TABS.map(t => {
              const active = mobilePanel === t.id;
              return (
                <button key={t.id}
                  onClick={() => setMobilePanel(active ? null : t.id)}
                  style={{
                    flex: 1, padding: '10px 4px', fontSize: 10, fontWeight: 700,
                    letterSpacing: .5, borderRadius: 'var(--radius)',
                    color: active ? t.color : 'var(--text3)',
                    background: active ? 'var(--elevated)' : 'transparent',
                    border: active ? `1px solid ${t.color}` : '1px solid transparent',
                  }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile panel overlay */}
      {!isDesktop && mobilePanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--surface)', display: 'flex', flexDirection: 'column', animation: 'slideUp .15s ease-out', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: TABS.find(t => t.id === mobilePanel)?.color }}>
              {TABS.find(t => t.id === mobilePanel)?.label}
            </span>
            <button onClick={() => setMobilePanel(null)} style={{ fontSize: 24, fontWeight: 700, color: 'var(--text3)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius)' }}>
              ×
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>{renderMobilePanelContent(mobilePanel)}</div>
        </div>
      )}

      {/* ════════════ STATUS BAR ════════════ */}
      <div style={{
        height: 'var(--status-h)', background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16,
        fontSize: 11, flexShrink: 0, zIndex: 80, fontWeight: 500,
      }}>
        <span style={{ color: 'var(--text3)' }}>Tool: <span style={{ color: 'var(--text2)' }}>{state.tool}</span></span>
        <span style={{ color: 'var(--text3)' }}>Layers: <span style={{ color: 'var(--text2)' }}>{doc.layers.length}</span></span>
        <div style={{ flex: 1 }} />
        <span style={{ color: doc.isDirty ? 'var(--amber)' : 'var(--green)', fontWeight: 600 }}>
          {doc.isDirty ? '● Unsaved' : 'Saved'}
        </span>
        <span style={{ color: 'var(--text3)', fontSize: 9 }}>|</span>
        <span style={{ color: 'var(--text3)', fontSize: 10 }}>Ctrl+S Save · Ctrl+Z Undo · Scroll Zoom</span>
      </div>
    </div>
  );
}
