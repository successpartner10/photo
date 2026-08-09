import React, { useState, useCallback } from 'react';
import { AI_FEATURES } from '../../data/presets';
import { AIAction, AIOperation, AIFilterStyle } from '../../types/editor';
import BeforeAfterSlider from '../Widgets/BeforeAfterSlider';
import { useEditor } from '../../store/editorStore';
import {
  applyAutoEnhance, applyBackgroundRemoval, applyGenerativeFill,
  applyGenerativeExpand, applyStyleFilter, applyUpscale,
  applyLayerSegmentation, applySmartText, applyAnimate,
} from '../../ai/aiEffects';

export default function AIPanel() {
  const { fabricRef, addLayer, saveSnapshot } = useEditor();
  const [runs, setRuns] = useState<AIOperation[]>([]);
  const [prompt, setPrompt] = useState('');
  const [showCompare, setShowCompare] = useState<AIOperation | null>(null);
  const [runningAction, setRunningAction] = useState<AIAction | null>(null);

  const runAI = useCallback(async (action: AIAction, label: string, extra?: { prompt?: string; style?: AIFilterStyle }) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    setRunningAction(action);
    const op: AIOperation = {
      id: `ai-${Date.now()}`, action, status: 'processing',
      prompt: extra?.prompt, styleFilter: extra?.style, timestamp: Date.now(),
    };
    setRuns(prev => [op, ...prev]);

    try {
      let before: string | undefined;
      switch (action) {
        case 'auto-enhance':
          before = await applyAutoEnhance(canvas); break;
        case 'background-remove':
          before = await applyBackgroundRemoval(canvas); break;
        case 'generative-fill':
          before = await applyGenerativeFill(canvas, extra?.prompt || ''); break;
        case 'generative-expand':
          before = await applyGenerativeExpand(canvas, 'horizontal'); break;
        case 'style-filter':
          before = await applyStyleFilter(canvas, extra?.style || 'cool'); break;
        case 'upscale':
          before = await applyUpscale(canvas); break;
        case 'layer-segment':
          before = await applyLayerSegmentation(canvas, addLayer); break;
        case 'smart-text':
          before = await applySmartText(canvas, addLayer); break;
        case 'animate':
          before = await applyAnimate(canvas); break;
      }
      saveSnapshot();

      const after = canvas.toDataURL({ format: 'png', quality: 1 });
      setRuns(prev => prev.map(r =>
        r.id === op.id ? { ...r, status: 'done' as const, beforeSnapshot: before, afterSnapshot: after } : r
      ));
    } catch {
      setRuns(prev => prev.map(r => r.id === op.id ? { ...r, status: 'error' as const } : r));
    }
    setRunningAction(null);
  }, [fabricRef, addLayer, saveSnapshot]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px', borderBottom: '1px solid #333',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#7C5CFC', textTransform: 'uppercase', letterSpacing: 1 }}>
          ✦ AI Tools
        </span>
        <span style={{ fontSize: 10, color: '#555', marginLeft: 'auto' }}>Non-destructive</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {/* AI Feature buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {AI_FEATURES.map(feat => {
            const isRunning = runningAction === feat.id;
            const hasResult = runs.some(r => r.action === feat.id && r.status === 'done');

            return (
              <button key={feat.id}
                onClick={() => {
                  if (feat.id === 'style-filter') {
                    // Show style submenu
                    setPrompt('style-picker');
                  } else if (feat.id === 'generative-fill') {
                    // Focus prompt
                    setPrompt('');
                  } else {
                    runAI(feat.id, feat.label);
                  }
                }}
                disabled={!!runningAction}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 10px', borderRadius: 8,
                  border: isRunning ? '1px solid #7C5CFC' : '1px solid #333',
                  background: isRunning ? '#7C5CFC15' : '#1a1a1a',
                  cursor: runningAction ? 'wait' : 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  opacity: runningAction ? 0.7 : 1, width: '100%',
                }}
              >
                <span style={{ fontSize: 22 }}>{feat.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{feat.label}</div>
                  <div style={{ fontSize: 10, color: '#777', marginTop: 1 }}>{feat.desc}</div>
                </div>
                {isRunning && <span style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>⏳</span>}
                {hasResult && !isRunning && <span style={{ fontSize: 12, color: '#4CAF50' }}>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Style filter picker */}
        {prompt === 'style-picker' && (
          <div style={{
            marginTop: 8, padding: 10, background: '#1a1a1a',
            borderRadius: 8, border: '1px solid #333',
          }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Choose a style filter:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {(['bw', 'cool', 'warm', 'vintage', 'dramatic', 'soft'] as AIFilterStyle[]).map(s => (
                <button key={s} onClick={() => { runAI('style-filter', `Style: ${s}`, { style: s }); setPrompt(''); }}
                  style={{
                    padding: '8px', borderRadius: 6, border: '1px solid #444',
                    background: '#222', color: '#ccc', cursor: 'pointer', fontSize: 11,
                    textTransform: 'capitalize',
                  }}>
                  {s === 'bw' ? 'B&W' : s === 'cool' ? '❄ Cool' : s === 'warm' ? '🔥 Warm' : s === 'vintage' ? '📷 Vintage' : s === 'dramatic' ? '🎭 Dramatic' : '🌸 Soft'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generative Fill prompt */}
        <div style={{
          marginTop: 10, padding: '10px', background: '#1a1a1a',
          borderRadius: 8, border: '1px solid #333',
        }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Generative Fill Prompt
          </div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder='Describe what to generate... "sunset sky", "forest background"'
            style={{
              width: '100%', height: 50, padding: '6px 10px', borderRadius: 6,
              border: '1px solid #333', background: '#111', color: '#ccc',
              fontSize: 12, resize: 'vertical', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
          <button onClick={() => { if (prompt.trim()) runAI('generative-fill', `Fill: "${prompt.slice(0, 30)}"`, { prompt }); }}
            disabled={!prompt.trim() || !!runningAction}
            style={{
              marginTop: 6, width: '100%', padding: '8px', borderRadius: 6,
              border: 'none', background: prompt.trim() && !runningAction ? '#7C5CFC' : '#333',
              color: prompt.trim() && !runningAction ? '#fff' : '#666',
              cursor: prompt.trim() && !runningAction ? 'pointer' : 'default',
              fontSize: 12, fontWeight: 600,
            }}>
            {runningAction ? 'Processing...' : 'Generate'}
          </button>
        </div>

        {/* Operation history with compare buttons */}
        {runs.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Recent Operations
            </div>
            {runs.slice(0, 8).map((run) => (
              <div key={run.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 8px', fontSize: 11,
                color: run.status === 'done' ? '#4CAF50' : run.status === 'error' ? '#E85D75' : '#FFA726',
                borderBottom: '1px solid #ffffff06',
              }}>
                <span>{run.status === 'done' ? '✓' : run.status === 'error' ? '✗' : '⏳'}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {run.action === 'style-filter' ? `Style: ${run.styleFilter}` : run.action}
                  {run.prompt ? `: "${run.prompt.slice(0, 20)}"` : ''}
                </span>
                {run.status === 'done' && run.beforeSnapshot && (
                  <button onClick={() => setShowCompare(run)} style={{
                    background: '#7C5CFC22', border: '1px solid #7C5CFC44',
                    borderRadius: 4, color: '#7C5CFC', cursor: 'pointer',
                    fontSize: 10, padding: '2px 6px',
                  }}>
                    Compare
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Before/After comparison modal */}
      {showCompare && (
        <BeforeAfterSlider
          beforeImage={showCompare.beforeSnapshot}
          afterImage={showCompare.afterSnapshot}
          label={`${showCompare.action} — Before / After`}
          onClose={() => setShowCompare(null)}
        />
      )}

      <div style={{
        padding: '8px 12px', borderTop: '1px solid #333',
        fontSize: 10, color: '#666', textAlign: 'center',
      }}>
        All AI edits are non-destructive · Re-prompt anytime
      </div>
    </div>
  );
}
