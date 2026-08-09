import React, { useState, useCallback, useEffect, useRef } from 'react';
import { filters } from 'fabric';
import { useEditor } from '../../store/editorStore';

// ── One-click Photoshop-style quick actions ──

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  category: 'adjust' | 'color' | 'filter' | 'transform' | 'ai';
  onClick: () => void;
}

export default function QuickActionsPanel() {
  const { fabricRef, saveSnapshot, doc } = useEditor();
  const [open, setOpen] = useState(false);

  const getActive = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return null;
    return c.getActiveObject();
  }, [fabricRef]);

  const applyToCanvas = useCallback((fn: (c: any) => void) => {
    const c = fabricRef.current;
    if (!c) return;
    fn(c);
    c.renderAll();
    saveSnapshot();
  }, [fabricRef, saveSnapshot]);

  // ── COLOR ADJUSTMENTS ──
  const handleInvert = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Invert()); o.applyFilters(); }
    });
  });

  const handleGrayscale = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Grayscale()); o.applyFilters(); }
    });
  });

  const handleSepia = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Sepia()); o.applyFilters(); }
    });
  });

  const handleVintage = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) {
        o.filters.push(new filters.Sepia());
        o.filters.push(new filters.Brightness({ brightness: -0.05 }));
        o.filters.push(new filters.Contrast({ contrast: -0.1 }));
        o.applyFilters();
      }
    });
  });

  // ── BRIGHTNESS/CONTRAST ──
  const handleBrighten = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Brightness({ brightness: 0.1 })); o.applyFilters(); }
    });
  });

  const handleDarken = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Brightness({ brightness: -0.1 })); o.applyFilters(); }
    });
  });

  const handleMoreContrast = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Contrast({ contrast: 0.15 })); o.applyFilters(); }
    });
  });

  const handleLessContrast = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Contrast({ contrast: -0.1 })); o.applyFilters(); }
    });
  });

  const handleMoreSaturation = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Saturation({ saturation: 0.2 })); o.applyFilters(); }
    });
  });

  const handleDesaturate = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Saturation({ saturation: -0.5 })); o.applyFilters(); }
    });
  });

  // ── BLUR / SHARPEN ──
  const handleBlur = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Blur({ blur: 0.3 })); o.applyFilters(); }
    });
  });

  const handleMoreBlur = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Blur({ blur: 0.7 })); o.applyFilters(); }
    });
  });

  const handleSharpen = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Contrast({ contrast: 0.1 })); o.applyFilters(); }
    });
  });

  // ── NOISE ──
  const handleNoise = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Noise({ noise: 20 })); o.applyFilters(); }
    });
  });

  const handlePixelate = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      if (o.filters) { o.filters.push(new filters.Pixelate({ blocksize: 6 })); o.applyFilters(); }
    });
  });

  // ── TRANSFORM ──
  const handleFlipH = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      o.set('flipX', !o.flipX);
    });
  });

  const handleFlipV = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      o.set('flipY', !o.flipY);
    });
  });

  const handleRotate90 = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      o.rotate((o.angle || 0) + 90);
    });
  });

  const handleDupe = () => applyToCanvas(c => {
    const active = c.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      c.add(cloned);
      c.setActiveObject(cloned);
    });
  });

  // ── RESET ──
  const handleResetFilters = () => applyToCanvas(c => {
    c.getObjects().forEach((o: any) => {
      if (o.data?.isBackground || o.data?.isCheckerboard) return;
      o.filters = [];
      o.applyFilters();
    });
  });

  const allActions: QuickAction[] = [
    { id: 'invert', label: 'Invert Colors', icon: '🔄', category: 'color', onClick: handleInvert },
    { id: 'grayscale', label: 'Black & White', icon: '⬜', category: 'color', onClick: handleGrayscale },
    { id: 'sepia', label: 'Sepia Tone', icon: '🟫', category: 'color', onClick: handleSepia },
    { id: 'vintage', label: 'Vintage Look', icon: '📷', category: 'color', onClick: handleVintage },
    { id: 'brighten', label: 'Brighten +', icon: '☀️', category: 'adjust', onClick: handleBrighten },
    { id: 'darken', label: 'Darken −', icon: '🌙', category: 'adjust', onClick: handleDarken },
    { id: 'contrast-up', label: 'More Contrast', icon: '◐', category: 'adjust', onClick: handleMoreContrast },
    { id: 'contrast-down', label: 'Less Contrast', icon: '◑', category: 'adjust', onClick: handleLessContrast },
    { id: 'saturate-up', label: 'Saturate +', icon: '🌈', category: 'adjust', onClick: handleMoreSaturation },
    { id: 'desaturate', label: 'Desaturate', icon: '🌫️', category: 'adjust', onClick: handleDesaturate },
    { id: 'blur', label: 'Blur', icon: '💧', category: 'filter', onClick: handleBlur },
    { id: 'blur-more', label: 'Blur More', icon: '💦', category: 'filter', onClick: handleMoreBlur },
    { id: 'sharpen', label: 'Sharpen', icon: '🔪', category: 'filter', onClick: handleSharpen },
    { id: 'noise', label: 'Add Noise', icon: '📺', category: 'filter', onClick: handleNoise },
    { id: 'pixelate', label: 'Pixelate', icon: '👾', category: 'filter', onClick: handlePixelate },
    { id: 'flip-h', label: 'Flip Horizontal', icon: '↔️', category: 'transform', onClick: handleFlipH },
    { id: 'flip-v', label: 'Flip Vertical', icon: '↕️', category: 'transform', onClick: handleFlipV },
    { id: 'rotate-90', label: 'Rotate 90°', icon: '↻', category: 'transform', onClick: handleRotate90 },
    { id: 'duplicate', label: 'Duplicate Layer', icon: '📋', category: 'transform', onClick: handleDupe },
    { id: 'reset', label: 'Reset Filters', icon: '🔄', category: 'adjust', onClick: handleResetFilters },
  ];

  const categories = ['adjust', 'color', 'filter', 'transform'] as const;
  const categoryLabels: Record<string, string> = {
    adjust: 'Adjustments', color: 'Color', filter: 'Filters', transform: 'Transform',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <h3>Quick Actions</h3>
        <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{allActions.length} ops</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {categories.map(cat => {
          const items = allActions.filter(a => a.category === cat);
          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-disabled)',
                textTransform: 'uppercase', letterSpacing: 1,
                padding: '4px 6px 8px',
              }}>
                {categoryLabels[cat]}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {items.map(a => (
                  <button key={a.id} onClick={a.onClick}
                    style={{
                      padding: '8px 6px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 10,
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.border = '1px solid var(--border-accent)';
                      e.currentTarget.style.background = 'var(--bg-overlay)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.border = '1px solid var(--border-default)';
                      e.currentTarget.style.background = 'var(--bg-elevated)';
                    }}>
                    <span style={{ fontSize: 13 }}>{a.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* AI shortcut */}
        <div style={{
          marginTop: 8, padding: 12,
          background: 'linear-gradient(135deg, var(--accent-glow), transparent)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-accent)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>✦</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 6 }}>
            Let AI handle it
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Switch to AI tab for auto enhancement, background removal, generative fill & more
          </div>
        </div>
      </div>
    </div>
  );
}
