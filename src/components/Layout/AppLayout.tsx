import React, { useState, useRef, useCallback, useEffect } from 'react';
import Canvas from '../Canvas/Canvas';
import Toolbar from '../Toolbar/Toolbar';
import LayersPanel from '../Panels/LayersPanel';
import PropertiesPanel from '../Panels/PropertiesPanel';
import AIPanel from '../Panels/AIPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import WelcomeModal from '../Widgets/WelcomeModal';
import CollaborationDialog from '../Widgets/CollaborationDialog';
import GradientEditor from '../Widgets/GradientEditor';
import FileMenu from '../Widgets/FileMenu';
import MobileNav from '../Widgets/MobileNav';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type RightTab = 'layers' | 'properties' | 'quick-actions' | 'ai' | 'export' | 'templates';

const TABS: { id: RightTab; label: string; icon: string }[] = [
  { id: 'layers', label: 'Layers', icon: '📑' },
  { id: 'properties', label: 'Props', icon: '⚙' },
  { id: 'quick-actions', label: 'Actions', icon: '⚡' },
  { id: 'ai', label: 'AI', icon: '✦' },
  { id: 'export', label: 'Export', icon: '📤' },
  { id: 'templates', label: 'Resize', icon: '📐' },
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

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Register SW
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/photo/sw.js').catch(() => {});
    }
  }, []);

  const handleNewDoc = () => {
    dispatch({ type: 'CREATE_DOCUMENT', payload: { name: `Untitled ${state.documents.length + 1}`, width: 1200, height: 800 } });
    setShowFileMenu(false);
  };

  const handleOpenFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.psd,.ai,.svg,.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp,.heic,.heif';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && canvasRef.current) canvasRef.current.importFile(file);
    };
    input.click();
    setShowFileMenu(false);
  }, []);

  const handleSave = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const dataURL = c.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
    const a = document.createElement('a');
    a.download = `${doc.name || 'design'}.png`;
    a.href = dataURL;
    a.click();
    setShowFileMenu(false);
  }, [fabricRef, doc.name]);

  const handleSaveAs = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const dataURL = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    const a = document.createElement('a');
    a.download = `${doc.name || 'design'}_2x.png`;
    a.href = dataURL;
    a.click();
    setShowFileMenu(false);
  }, [fabricRef, doc.name]);

  const handleExportPNG = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const link = document.createElement('a');
    link.download = `${doc.name || 'design'}.png`;
    link.href = c.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
    link.click();
    setShowFileMenu(false);
  }, [fabricRef, doc.name]);

  const handleWelcomeStart = (w: number, h: number) => {
    dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } });
    saveSnapshot();
    setShowWelcome(false);
  };

  const handleGradientApply = () => { setShowGradient(false); saveSnapshot(); };

  const renderRightPanel = () => {
    switch (rightTab) {
      case 'layers': return <LayersPanel />;
      case 'properties': return <PropertiesPanel />;
      case 'quick-actions': return <QuickActionsPanel />;
      case 'ai': return <AIPanel />;
      case 'export': return <ExportPanel />;
      case 'templates': return <TemplatesPanel />;
    }
  };

  const renderMobilePanel = () => {
    if (!mobileTab) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg-surface)',
        display: 'flex', flexDirection: 'column', animation: 'slideUp 0.2s var(--ease-out)',
      }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <h3>{TABS.find(t => t.id === mobileTab)?.label || 'Panel'}</h3>
          <button onClick={() => setMobileTab(null)} style={{ fontSize: 18, color: 'var(--text-muted)', padding: '4px 8px' }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {mobileTab === 'layers' && <LayersPanel />}
          {mobileTab === 'properties' && <PropertiesPanel />}
          {mobileTab === 'quick-actions' && <QuickActionsPanel />}
          {mobileTab === 'ai' && <AIPanel />}
          {mobileTab === 'export' && <ExportPanel />}
          {mobileTab === 'templates' && <TemplatesPanel />}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-root)' }}>
      {/* Modals */}
      {showWelcome && <WelcomeModal onStart={handleWelcomeStart} onClose={() => setShowWelcome(false)} />}
      {showShare && <CollaborationDialog projectName={doc.name} onClose={() => setShowShare(false)} />}
      {showGradient && <GradientEditor onApply={handleGradientApply} onClose={() => setShowGradient(false)} />}

      {/* ====================== TOP BAR ====================== */}
      <div style={{
        height: 'var(--topbar-h)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px',
        gap: 4,
        flexShrink: 0,
        zIndex: 100,
      }}>
        {/* File menu */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFileMenu(!showFileMenu)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: showFileMenu ? 'var(--bg-overlay)' : 'transparent',
              color: '#fff', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
              border: showFileMenu ? '1px solid var(--border-default)' : '1px solid transparent',
            }}>
            ☰ File
          </button>
          {showFileMenu && (
            <FileMenu
              onClose={() => setShowFileMenu(false)}
              onNew={handleNewDoc}
              onOpen={handleOpenFile}
              onSave={handleSave}
              onSaveAs={handleSaveAs}
              onExportPNG={handleExportPNG}
              onShare={() => { setShowShare(true); setShowFileMenu(false); }}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={() => dispatch({ type: 'UNDO' })}
              onRedo={() => dispatch({ type: 'REDO' })}
            />
          )}
        </div>

        {/* Section divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 6px' }} />

        {/* Document tabs */}
        <div style={{ display: 'flex', gap: 1, flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {state.documents.map(d => (
            <div key={d.id}
              onClick={() => dispatch({ type: 'SWITCH_DOCUMENT', payload: d.id })}
              style={{
                padding: '8px 12px', borderRadius: '6px 6px 0 0',
                fontSize: 11, cursor: 'pointer', maxWidth: 150,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 5,
                background: d.id === state.activeDocumentId ? 'var(--bg-elevated)' : 'transparent',
                color: d.id === state.activeDocumentId ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: d.id === state.activeDocumentId
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                transition: 'all 0.12s var(--ease-out)',
              }}>
              <span style={{ fontSize: 9, color: d.isDirty ? 'var(--warning)' : 'var(--success)' }}>
                {d.isDirty ? '●' : '○'}
              </span>
              <span>{d.name}</span>
              {state.documents.length > 1 && (
                <span onClick={e => { e.stopPropagation(); dispatch({ type: 'CLOSE_DOCUMENT', payload: d.id }); }}
                  style={{ fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1, marginLeft: 2, fontWeight: 700 }}>×</span>
              )}
            </div>
          ))}
          <button onClick={handleNewDoc} style={{
            padding: '8px 10px', color: 'var(--text-muted)', fontSize: 15, fontWeight: 300,
          }}>+</button>
        </div>

        {/* Section divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
            style={topAction} title="Undo (Ctrl+Z)">↩</button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
            style={topAction} title="Redo (Ctrl+Shift+Z)">↪</button>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />

          <select value={`${doc.canvas.width}x${doc.canvas.height}`}
            onChange={e => {
              const [w, h] = e.target.value.split('x').map(Number);
              if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); }
            }}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)', padding: '4px 24px 4px 8px', borderRadius: 'var(--radius-sm)',
              fontSize: 10, maxWidth: 120, cursor: 'pointer',
            }}>
            <option>{doc.canvas.width}×{doc.canvas.height}</option>
            {PLATFORM_PRESETS.filter(p => p.id !== 'custom').slice(0, 6).map(p => (
              <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform}: {p.width}×{p.height}</option>
            ))}
          </select>

          <button onClick={handleSave} style={{ ...topAction, color: 'var(--success)' }} title="Save (Ctrl+S)">💾</button>
          <button onClick={() => setShowShare(true)} style={{ ...topAction, color: 'var(--info)' }} title="Share">👥</button>
          <button onClick={() => setShowGradient(true)} style={{ ...topAction, color: 'var(--warning)' }} title="Gradient">◧</button>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', margin: '0 4px' }} />

          <button onClick={() => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode })}
            style={{
              ...topAction, fontSize: 10, fontWeight: 600,
              color: basicMode ? 'var(--accent)' : 'var(--text-muted)',
              border: basicMode ? '1px solid var(--border-accent)' : '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)', padding: '3px 8px',
            }}>
            {basicMode ? 'Basic' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* ====================== MAIN BODY ====================== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {!isMobile && <Toolbar />}
        <Canvas ref={canvasRef} />

        {/* Right panel (desktop only) */}
        {!isMobile && (
          <div style={{
            width: 'var(--panel-w)', background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setRightTab(tab.id)}
                  style={{
                    flex: 1, padding: '10px 3px', fontSize: 13,
                    background: rightTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                    border: 'none',
                    borderBottom: rightTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                    color: rightTab === tab.id ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.12s var(--ease-out)',
                  }}>
                  {tab.icon}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{renderRightPanel()}</div>
          </div>
        )}
      </div>

      {/* ====================== MOBILE BOTTOM NAV ====================== */}
      {isMobile && (
        <MobileNav
          tabs={TABS}
          activeTab={mobileTab}
          onSelect={(id) => setMobileTab(mobileTab === id ? null : id)}
          onFileMenu={() => setShowFileMenu(true)}
        />
      )}

      {/* ====================== MOBILE PANEL OVERLAY ====================== */}
      {isMobile && renderMobilePanel()}

      {/* ====================== STATUS BAR ====================== */}
      <div style={{
        height: 'var(--statusbar-h)',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 14,
        fontSize: 10,
        flexShrink: 0,
        zIndex: 80,
      }}>
        <span style={{ color: 'var(--text-muted)' }}>
          Tool: <span style={{ color: 'var(--text-secondary)' }}>{state.tool}</span>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Layers: <span style={{ color: 'var(--text-secondary)' }}>{doc.layers.length}</span>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Mode: <span style={{ color: basicMode ? 'var(--accent)' : 'var(--text-secondary)' }}>
            {basicMode ? 'Basic' : 'Advanced'}
          </span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: doc.isDirty ? 'var(--warning)' : 'var(--success)' }}>
          {doc.isDirty ? '● Unsaved' : '○ Saved'}
          {doc.lastSaved ? ` · ${new Date(doc.lastSaved).toLocaleTimeString()}` : ''}
        </span>
        <span style={{ color: 'var(--border-strong)' }}>|</span>
        <span style={{ color: 'var(--text-disabled)' }}>
          Ctrl+S Save · Ctrl+Z Undo · Scroll Zoom
        </span>
      </div>
    </div>
  );
}

const topAction: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
  cursor: 'pointer', fontSize: 15, padding: '4px 6px', borderRadius: 'var(--radius-sm)',
  display: 'flex', alignItems: 'center', transition: 'all 0.1s',
};
