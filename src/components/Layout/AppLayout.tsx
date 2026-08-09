import React, { useState, useCallback, useRef } from 'react';
import Canvas from '../Canvas/Canvas';
import Toolbar from '../Toolbar/Toolbar';
import LayersPanel from '../Panels/LayersPanel';
import PropertiesPanel from '../Panels/PropertiesPanel';
import AIPanel from '../Panels/AIPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import WelcomeModal from '../Widgets/WelcomeModal';
import CollaborationDialog from '../Widgets/CollaborationDialog';
import GradientEditor from '../Widgets/GradientEditor';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';

type RightTab = 'layers' | 'properties' | 'ai' | 'export' | 'templates';

const TABS: { id: RightTab; label: string; icon: string }[] = [
  { id: 'layers', label: 'Layers', icon: '📑' },
  { id: 'properties', label: 'Props', icon: '⚙' },
  { id: 'ai', label: 'AI', icon: '✦' },
  { id: 'export', label: 'Export', icon: '📤' },
  { id: 'templates', label: 'Templates', icon: '📐' },
];

export default function AppLayout() {
  const { state, dispatch, doc, saveSnapshot, fabricRef, addLayer } = useEditor();
  const [rightTab, setRightTab] = useState<RightTab>('layers');
  const canvasRef = useRef<any>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showGradient, setShowGradient] = useState(false);
  const { basicMode } = state.globalSettings;

  const currentDoc = state.documents.find(d => d.id === state.activeDocumentId) || state.documents[0];
  const canUndo = currentDoc.historyIndex >= 0;
  const canRedo = currentDoc.historyIndex < currentDoc.history.length - 1;

  const handleNewDoc = () => {
    dispatch({
      type: 'CREATE_DOCUMENT',
      payload: { name: `Untitled ${state.documents.length + 1}`, width: 1200, height: 800 },
    });
  };

  const handleWelcomeStart = (w: number, h: number) => {
    dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } });
    saveSnapshot();
    setShowWelcome(false);
  };

  const handleQuickSave = () => {
    const c = fabricRef.current;
    if (!c) return;
    const dataURL = c.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
    const a = document.createElement('a');
    a.download = `${doc.name || 'design'}.png`;
    a.href = dataURL;
    a.click();
  };

  const handleGradientApply = (grad: { type: 'linear' | 'radial'; angle: number; stops: { offset: number; color: string }[] }) => {
    const c = fabricRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (active) {
      const colorStops: Record<string, string> = {};
      grad.stops.forEach(s => { colorStops[`${s.offset / 100}`] = s.color; });
      if (grad.type === 'linear') {
        active.set('fill', new (active.constructor as any).Gradient
          ? { type: 'linear', x1: 0, y1: 0, x2: 1, y2: 1, colorStops: grad.stops.map(s => ({ offset: s.offset / 100, color: s.color })) }
          : grad.stops[0].color);
      }
      c.renderAll();
      saveSnapshot();
    }
    setShowGradient(false);
  };

  const renderRightPanel = () => {
    switch (rightTab) {
      case 'layers': return <LayersPanel />;
      case 'properties': return <PropertiesPanel />;
      case 'ai': return <AIPanel />;
      case 'export': return <ExportPanel />;
      case 'templates': return <TemplatesPanel />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a1a' }}>
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal
          onStart={handleWelcomeStart}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* Collaboration dialog */}
      {showShare && (
        <CollaborationDialog
          projectName={doc.name}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Gradient editor */}
      {showGradient && (
        <GradientEditor
          onApply={handleGradientApply}
          onClose={() => setShowGradient(false)}
        />
      )}

      {/* ---- TOP BAR ---- */}
      <div style={{
        height: 40, background: '#252525', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', padding: '0 8px', gap: 6,
      }}>
        {/* Logo */}
        <div style={{ fontWeight: 700, fontSize: 14, color: '#7C5CFC', letterSpacing: -0.5, marginRight: 6 }}>
          DesignEditor
        </div>

        {/* Document tabs */}
        <div style={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }}>
          {state.documents.map(d => (
            <div key={d.id}
              onClick={() => dispatch({ type: 'SWITCH_DOCUMENT', payload: d.id })}
              style={{
                padding: '6px 12px', borderRadius: '6px 6px 0 0',
                fontSize: 11, cursor: 'pointer', maxWidth: 140,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                background: d.id === state.activeDocumentId ? '#2a2a2a' : 'transparent',
                color: d.id === state.activeDocumentId ? '#ddd' : '#777',
                borderBottom: d.id === state.activeDocumentId ? '2px solid #7C5CFC' : '2px solid transparent',
                transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: 10, color: d.isDirty ? '#FFA726' : '#4CAF50' }}>{d.isDirty ? '●' : '○'}</span>
              <span>{d.name}</span>
              {state.documents.length > 1 && (
                <span onClick={e => { e.stopPropagation(); dispatch({ type: 'CLOSE_DOCUMENT', payload: d.id }); }}
                  style={{ marginLeft: 2, color: '#555', fontSize: 14, lineHeight: 1, cursor: 'pointer' }}>
                  ×
                </span>
              )}
            </div>
          ))}
          <button onClick={handleNewDoc} style={{
            padding: '6px 10px', background: 'transparent', border: 'none',
            color: '#666', cursor: 'pointer', fontSize: 16,
          }}>+</button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
            style={{ ...actionBtn, opacity: canUndo ? 1 : 0.4 }} title="Undo (Ctrl+Z)">↩</button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
            style={{ ...actionBtn, opacity: canRedo ? 1 : 0.4 }} title="Redo (Ctrl+Shift+Z)">↪</button>

          <div style={{ width: 1, height: 18, background: '#444', margin: '0 2px' }} />

          <select
            value={`${doc.canvas.width}x${doc.canvas.height}`}
            onChange={e => {
              const [w, h] = e.target.value.split('x').map(Number);
              if (w && h) { dispatch({ type: 'SET_CANVAS', payload: { width: w, height: h } }); saveSnapshot(); }
            }}
            style={{
              background: '#1a1a1a', border: '1px solid #333', color: '#ccc',
              padding: '3px 6px', borderRadius: 4, fontSize: 10, cursor: 'pointer', maxWidth: 130,
            }}>
            <option value={`${doc.canvas.width}x${doc.canvas.height}`}>{doc.canvas.width}×{doc.canvas.height}</option>
            {PLATFORM_PRESETS.filter(p => p.id !== 'custom').slice(0, 8).map(p => (
              <option key={p.id} value={`${p.width}x${p.height}`}>{p.platform}: {p.width}×{p.height}</option>
            ))}
          </select>

          <button onClick={handleQuickSave} style={{ ...actionBtn, color: '#4CAF50' }} title="Quick Save (Ctrl+S)">💾</button>

          <button onClick={() => setShowShare(true)}
            style={{ ...actionBtn, color: '#5B9BD5' }} title="Share & Collaborate">👥</button>

          <button onClick={() => setShowGradient(true)}
            style={{ ...actionBtn, color: '#FFA726' }} title="Gradient Editor">◧</button>

          <button onClick={() => setShowWelcome(true)}
            style={{ ...actionBtn, fontSize: 14 }} title="Help & Shortcuts">?</button>

          <button onClick={() => dispatch({ type: 'SET_BASIC_MODE', payload: !basicMode })}
            style={{
              ...actionBtn, fontSize: 10, color: basicMode ? '#7C5CFC' : '#888',
              border: basicMode ? '1px solid #7C5CFC44' : '1px solid #333',
              borderRadius: 4, padding: '2px 8px',
            }}>
            {basicMode ? 'Basic' : 'Advanced'}
          </button>
        </div>
      </div>

      {/* ---- MAIN BODY ---- */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Toolbar />
        <Canvas ref={canvasRef} />
        <div style={{
          width: 280, background: '#1e1e1e', borderLeft: '1px solid #333',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setRightTab(tab.id)}
                style={{
                  flex: 1, padding: '8px 4px',
                  background: rightTab === tab.id ? '#1e1e1e' : '#252525',
                  border: 'none',
                  borderBottom: rightTab === tab.id ? '2px solid #7C5CFC' : '2px solid transparent',
                  color: rightTab === tab.id ? '#fff' : '#888',
                  cursor: 'pointer', fontSize: 14, transition: 'all 0.1s',
                }}>
                {tab.icon}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>{renderRightPanel()}</div>
        </div>
      </div>

      {/* ---- STATUS BAR ---- */}
      <div style={{
        height: 24, background: '#252525', borderTop: '1px solid #333',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 12,
      }}>
        <span style={{ fontSize: 10, color: '#777' }}>
          Tool: <span style={{ color: '#aaa' }}>{state.tool}</span>
        </span>
        <span style={{ fontSize: 10, color: '#777' }}>
          Layers: <span style={{ color: '#aaa' }}>{doc.layers.length}</span>
        </span>
        <span style={{ fontSize: 10, color: '#777' }}>
          Mode: <span style={{ color: basicMode ? '#7C5CFC' : '#aaa' }}>{basicMode ? 'Basic' : 'Advanced'}</span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: '#555' }}>
          {doc.isDirty ? '● Unsaved' : '○ Saved'}
          {doc.lastSaved ? ` · ${new Date(doc.lastSaved).toLocaleTimeString()}` : ''}
        </span>
        <span style={{ fontSize: 9, color: '#444' }}>|</span>
        <span style={{ fontSize: 10, color: '#555' }}>
          Ctrl+S Save · Ctrl+Z Undo · Scroll Zoom · Space+Drag Pan · Del Delete
        </span>
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#aaa',
  cursor: 'pointer', fontSize: 15, padding: '3px 6px', borderRadius: 4,
  display: 'flex', alignItems: 'center', transition: 'all 0.1s',
};
