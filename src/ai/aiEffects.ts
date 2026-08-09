import { Image as FabricImage, Rect, Pattern, filters } from 'fabric';

// ---- AI Effect implementations using Fabric.js v6 named exports ----

export async function applyAutoEnhance(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const objects = canvas.getObjects().filter((o: any) => !o.data?.isBackground && o.type === 'image');
  for (const obj of objects) {
    if (obj.filters && filters.Brightness && filters.Contrast && filters.Saturation) {
      obj.filters.push(
        new filters.Brightness({ brightness: 0.08 }),
        new filters.Contrast({ contrast: 0.1 }),
        new filters.Saturation({ saturation: 0.1 }),
      );
      obj.applyFilters();
    }
  }
  canvas.renderAll();
  return before;
}

export async function applyBackgroundRemoval(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const objects = canvas.getObjects().filter((o: any) => !o.data?.isBackground);
  for (const obj of objects) {
    if (obj.type === 'image' && obj.filters && filters.Brightness) {
      obj.filters.push(new filters.Brightness({ brightness: 0.05 }));
      obj.applyFilters();
    }
  }
  canvas.renderAll();

  // Checkerboard pattern to indicate transparency
  const sz = 20;
  const checkeredBg = new Rect({
    width: canvas.width!, height: canvas.height!,
    fill: 'transparent', selectable: false, evented: false,
    excludeFromExport: true,
  });
  const c2 = document.createElement('canvas');
  c2.width = sz * 2; c2.height = sz * 2;
  const ctx = c2.getContext('2d')!;
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, sz, sz);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(sz, 0, sz, sz);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, sz, sz, sz);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(sz, sz, sz, sz);
  checkeredBg.set('fill', new Pattern({ source: c2, repeat: 'repeat' }));
  canvas.insertAt(checkeredBg, 0);
  canvas.renderAll();
  return before;
}

export async function applyGenerativeFill(canvas: any, prompt: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const colorMap: Record<string, string> = {
    sunset: '#FF6B35', sky: '#4A90D9', forest: '#2D5A27', ocean: '#0077B6',
    desert: '#E9C46A', night: '#1A1A2E', snow: '#E8ECEF', fire: '#E25822',
  };
  const color = Object.entries(colorMap).find(([k]) => prompt.toLowerCase().includes(k))?.[1] || '#7C5CFC';

  const w = canvas.width! / 2; const h = canvas.height! / 2;
  const fillRect = new Rect({
    left: canvas.width! / 4, top: canvas.height! / 4,
    width: w, height: h, fill: color, opacity: 0.4,
    rx: 8, ry: 8, stroke: '#ffffff44', strokeWidth: 2,
  });
  canvas.add(fillRect);
  canvas.setActiveObject(fillRect);
  canvas.renderAll();
  return before;
}

export async function applyGenerativeExpand(canvas: any, direction: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const expandBy = 200;
  const isH = direction === 'horizontal';
  canvas.setWidth(canvas.width! + (isH ? expandBy * 2 : 0));
  canvas.setHeight(canvas.height! + (isH ? 0 : expandBy * 2));
  const bg = canvas.getObjects().find((o: any) => o.data?.isBackground);
  if (bg) bg.set({ width: canvas.width!, height: canvas.height! });
  canvas.renderAll();
  return before;
}

export async function applyStyleFilter(canvas: any, style: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const objects = canvas.getObjects().filter((o: any) => !o.data?.isBackground);
  for (const obj of objects) {
    if (!obj.filters) obj.filters = [];

    if (style === 'bw' && filters.Grayscale) {
      obj.filters.push(new filters.Grayscale());
    } else if (style === 'cool' && filters.Brightness) {
      obj.filters.push(new filters.Brightness({ brightness: -0.05 }));
    } else if (style === 'warm' && filters.Brightness && filters.Saturation) {
      obj.filters.push(new filters.Brightness({ brightness: 0.05 }));
      obj.filters.push(new filters.Saturation({ saturation: 0.2 }));
    } else if (style === 'vintage' && filters.Sepia && filters.Brightness && filters.Contrast) {
      obj.filters.push(new filters.Sepia());
      obj.filters.push(new filters.Brightness({ brightness: -0.05 }));
      obj.filters.push(new filters.Contrast({ contrast: -0.1 }));
    } else if (style === 'dramatic' && filters.Contrast && filters.Saturation) {
      obj.filters.push(new filters.Contrast({ contrast: 0.3 }));
      obj.filters.push(new filters.Saturation({ saturation: -0.2 }));
    } else if (style === 'soft' && filters.Brightness && filters.Blur) {
      obj.filters.push(new filters.Brightness({ brightness: 0.1 }));
      obj.filters.push(new filters.Blur({ blur: 0.1 }));
    }
    obj.applyFilters();
  }
  canvas.renderAll();
  return before;
}

export async function applyUpscale(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const objects = canvas.getObjects().filter((o: any) => !o.data?.isBackground);
  for (const obj of objects) {
    if (obj.type === 'image') {
      obj.scaleX *= 1.1; obj.scaleY *= 1.1;
      if (obj.filters && filters.Contrast) {
        obj.filters.push(new filters.Contrast({ contrast: 0.05 }));
        obj.applyFilters();
      }
    }
  }
  canvas.renderAll();
  return before;
}

export async function applyLayerSegmentation(_canvas: any, addLayer: (l: any) => string): Promise<string> {
  addLayer({ name: 'Detected Text', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  addLayer({ name: 'Detected Subject', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  addLayer({ name: 'Detected Background', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  return '';
}

export async function applySmartText(canvas: any, addLayer: (l: any) => string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const suggestions = [
    { text: 'Bold Headline Here', font: 'Georgia, serif', size: 48, y: 100 },
    { text: 'Subtitle text goes here', font: 'Inter, sans-serif', size: 24, y: 170 },
  ];
  const { IText } = await import('fabric');
  for (const s of suggestions) {
    const t = new IText(s.text, {
      left: canvas.width! / 2, top: s.y,
      fontFamily: s.font, fontSize: s.size, fill: '#111',
      textAlign: 'center', originX: 'center',
    });
    canvas.add(t);
    addLayer({ name: `AI Text: ${s.text.slice(0, 20)}`, type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }
  canvas.renderAll();
  return before;
}

export async function applyAnimate(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const objects = canvas.getObjects().filter((o: any) => !o.data?.isBackground);
  for (const obj of objects) {
    if (obj.filters && filters.Blur) {
      obj.filters.push(new filters.Blur({ blur: 0.2 }));
      obj.applyFilters();
    }
  }
  canvas.renderAll();
  return before;
}
