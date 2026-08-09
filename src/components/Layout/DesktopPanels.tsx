import React, { useState, useEffect } from 'react';
import { useEditor } from '../../store/editorStore';
import { PLATFORM_PRESETS } from '../../data/presets';
import LayersPanel from '../Panels/LayersPanel';
import QuickActionsPanel from '../Panels/QuickActionsPanel';
import AISuggestionsPanel from '../Panels/AISuggestionsPanel';
import ExportPanel from '../Panels/ExportPanel';
import TemplatesPanel from '../Panels/TemplatesPanel';
import ReviewStudio from '../Panels/ReviewStudio';
import CollagePanel from '../Panels/CollagePanel';

type Tab = 'layers' | 'adjust' | 'ai' | 'collage' | 'preview' | 'resize' | 'export';

const TABS: { id: Tab; label: string; color: string; icon: string }[] = [
  { id: 'layers', label: 'Layers', color: 'var(--accent)', icon: '📑' },
  { id: 'adjust', label: 'Effects', color: 'var(--pink)', icon: '✨' },
  { id: 'ai', label: 'AI', color: 'var(--teal)', icon: '🤖' },
  { id: 'collage', label: 'Layout', color: 'var(--amber)', icon: '🖼' },
  { id: 'preview', label: 'Preview', color: 'var(--blue)', icon: '👁' },
  { id: 'resize', label: 'Resize', color: 'var(--green)', icon: '📐' },
  { id: 'export', label: 'Export', color: 'var(--green)', icon: '📤' },
];

export default function DesktopPanels() {
  const { doc, dispatch, saveSnapshot } = useEditor();
  const [tab, setTab] = useState<Tab>('layers');

  const renderPanel = () => {
    switch (tab) {
      case 'layers': return <LayersPanel />;
      case 'adjust': return <QuickActionsPanel />;
      case 'ai': return <AISuggestionsPanel />;
      case 'collage': return <CollagePanel />;
      case 'preview': return <ReviewStudio />;
      case 'resize': return <TemplatesPanel />;
      case 'export': return <ExportPanel />;
    }
  };

  return (
    <div style={{
      width: 300, background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', background: 'var(--card)', borderBottom: '1px solid var(--border)',
        height: 40, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '0 12px', fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? t.color : 'var(--text3)', whiteSpace: 'nowrap',
              borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              borderRadius: 0, background: 'transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>{renderPanel()}</div>
    </div>
  );
}
