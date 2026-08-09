import React, { useState, useCallback } from 'react';
import { AI_FEATURES } from '../../data/presets';
import { AIAction, AIOperation, AIFilterStyle } from '../../types/editor';
import BeforeAfterSlider from '../Widgets/BeforeAfterSlider';
import { useEditor } from '../../store/editorStore';
import {
  applyAutoEnhance, applyBackgroundRemoval, applyGenerativeFill,
  applyGenerativeExpand, applyStyleFilter, applyLayerSegmentation,
  applySmartText, applyAnimate,
} from '../../ai/aiEffects';
import { applyUpscale4x } from '../../ai/aiUpscale';
import { rasterToCanvasVectors } from '../../ai/aiVectorize';

export default function AIPanel() {
  const { fabricRef, addLayer, saveSnapshot } = useEditor();
  const [runs, setRuns] = useState<AIOperation[]>([]);
  const [prompt, setPrompt] = useState('');
  const [showCompare, setShowCompare] = useState<AIOperation | null>(null);
  const [runningAction, setRunningAction] = useState<AIAction | null>(null);
  const [vectorMode, setVectorMode] = useState<'outline' | 'color-layers' | 'both'>('both');
  const [vectorColors, setVectorColors] = useState(6);

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
        case 'layer-segment':
          before = await applyLayerSegmentation(canvas, addLayer); break;
        case 'smart-text':
          before = await applySmartText(canvas, addLayer); break;
        case 'animate':
          before = await applyAnimate(canvas); break;
        case 'upscale-4x':
          before = await applyUpscale4x(canvas, addLayer); break;
        case 'vectorize':
          before = await rasterToCanvasVectors(canvas, addLayer, vectorMode, vectorColors); break;
        default:
          break;
      }
      saveSnapshot();

      const after = canvas.toDataURL({ format: 'png', quality: 1 });
      setRuns(prev => prev.map(r =>
        r.id === op.id ? { ...r, status: 'done' as const, beforeSnapshot: before, afterSnapshot: after } : r
      ));
    } catch (e) {
      console.error(e);
      setRuns(prev => prev.map(r => r.id === op.id ? { ...r, status: 'error' as const } : r));
    }
    setRunningAction(null);
  }, [fabricRef, addLayer, saveSnapshot, vectorMode, vectorColors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <h3>✦ AI Tools</h3>
        <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>Non-destructive</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {AI_FEATURES.map(feat => {
          const isRunning = runningAction === feat.id;
          const hasResult = runs.some(r => r.action === feat.id && r.status === 'done');

          return (
            <button key={feat.id}
              onClick={() => {
                if (feat.id === 'style-filter') { setPrompt('style-picker'); }
                else if (feat.id === 'generative-fill') { setPrompt(''); }
                else if (feat.id === 'vectorize') { setPrompt('vectorize-options'); }
                else { runAI(feat.id, feat.label); }
              }}
              disabled={!!runningAction}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 10px', borderRadius: 'var(--radius-sm)',
                border: isRunning ? '1px solid var(--border-accent)' : '1px solid var(--border-default)',
                background: isRunning ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                cursor: runningAction ? 'wait' : 'pointer',
                textAlign: 'left', transition: 'all 0.15s',
                opacity: runningAction ? 0.7 : 1, width: '100%',
                marginBottom: 4,
              }}>
              <span style={{ fontSize: 20 }}>{feat.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{feat.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{feat.desc}</div>
              </div>
              {isRunning && <span style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}>⏳</span>}
              {hasResult && !isRunning && <span style={{ fontSize: 11, color: 'var(--success)' }}>✓</span>}
            </button>
          );
        })}

        {/* Style picker */}
        {prompt === 'style-picker' && (
          <div style={{ marginTop: 6, padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>Style:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              {(['bw', 'cool', 'warm', 'vintage', 'dramatic', 'soft'] as AIFilterStyle[]).map(s => (
                <button key={s} onClick={() => { runAI('style-filter', `Style: ${s}`, { style: s }); setPrompt(''); }}
                  style={{ padding: '7px 6px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-overlay)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10, textTransform: 'capitalize' }}>
                  {s === 'bw' ? 'B&W' : s === 'cool' ? '❄ Cool' : s === 'warm' ? '🔥 Warm' : s === 'vintage' ? '📷 Vintage' : s === 'dramatic' ? '🎭 Dramatic' : '🌸 Soft'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vectorize options */}
        {prompt === 'vectorize-options' && (
          <div style={{ marginTop: 6, padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>Vectorize Mode:</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {(['outline', 'color-layers', 'both'] as const).map(m => (
                <button key={m} onClick={() => setVectorMode(m)} style={{
                  flex: 1, padding: '6px 4px', borderRadius: 'var(--radius-sm)', fontSize: 10,
                  border: vectorMode === m ? '1px solid var(--border-accent)' : '1px solid var(--border-default)',
                  background: vectorMode === m ? 'var(--accent-glow)' : 'var(--bg-overlay)',
                  color: vectorMode === m ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
                  textTransform: 'capitalize',
                }}>{m.replace('-', ' ')}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
              Colors: {vectorColors}
            </div>
            <input type="range" min={2} max={16} value={vectorColors}
              onChange={e => setVectorColors(+e.target.value)}
              style={{ width: '100%', marginBottom: 8 }} />
            <button onClick={() => { runAI('vectorize', 'Raster → SVG Vector'); setPrompt(''); }}
              disabled={!!runningAction}
              style={{
                width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)',
                border: 'none', background: runningAction ? 'var(--bg-overlay)' : 'var(--accent)',
                color: '#fff', cursor: runningAction ? 'wait' : 'pointer',
                fontSize: 11, fontWeight: 600,
              }}>
              {runningAction ? 'Tracing...' : `Trace as ${vectorMode.replace('-',' ')} (${vectorColors} colors) → SVG`}
            </button>
          </div>
        )}

        {/* Generative Fill prompt */}
        {prompt !== 'style-picker' && prompt !== 'vectorize-options' && (
          <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Prompt
            </div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder='e.g. "sunset sky", "forest background"'
              style={{
                width: '100%', height: 44, padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: 11, resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              }} />
            <button onClick={() => { if (prompt.trim()) runAI('generative-fill', `Fill: "${prompt.slice(0, 30)}"`, { prompt }); }}
              disabled={!prompt.trim() || !!runningAction}
              style={{
                marginTop: 5, width: '100%', padding: '7px', borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: prompt.trim() && !runningAction ? 'var(--accent)' : 'var(--bg-overlay)',
                color: prompt.trim() && !runningAction ? '#fff' : 'var(--text-disabled)',
                cursor: prompt.trim() && !runningAction ? 'pointer' : 'default',
                fontSize: 11, fontWeight: 600,
              }}>
              {runningAction ? 'Processing...' : 'Generate'}
            </button>
          </div>
        )}

        {/* History */}
        {runs.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9, color: 'var(--text-disabled)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              History
            </div>
            {runs.slice(0, 6).map((run) => (
              <div key={run.id} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 6px', fontSize: 10,
                color: run.status === 'done' ? 'var(--success)' : run.status === 'error' ? 'var(--danger)' : 'var(--warning)',
              }}>
                <span>{run.status === 'done' ? '✓' : run.status === 'error' ? '✗' : '⏳'}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                  {run.action} {run.prompt ? `"${run.prompt.slice(0, 16)}"` : ''}
                </span>
                {run.status === 'done' && run.beforeSnapshot && (
                  <button onClick={() => setShowCompare(run)} style={{
                    background: 'var(--accent-glow)', border: '1px solid var(--border-accent)',
                    borderRadius: 3, color: 'var(--accent)', cursor: 'pointer',
                    fontSize: 9, padding: '1px 5px',
                  }}>Compare</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCompare && (
        <BeforeAfterSlider
          beforeImage={showCompare.beforeSnapshot}
          afterImage={showCompare.afterSnapshot}
          label={`${showCompare.action} — Before / After`}
          onClose={() => setShowCompare(null)}
        />
      )}

      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--border-subtle)', fontSize: 9, color: 'var(--text-disabled)', textAlign: 'center' }}>
        All edits non-destructive · Re-prompt anytime
      </div>
    </div>
  );
}
