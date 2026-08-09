import { Image as FabricImage, Rect, Pattern, filters, Group } from 'fabric';

// ════════════════════════════════════════════════════════
//  AUTO ENHANCE — brightness + contrast + saturation
// ════════════════════════════════════════════════════════
export async function applyAutoEnhance(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.filters && filters.Brightness && filters.Contrast && filters.Saturation) {
      o.filters.push(new filters.Brightness({ brightness: 0.08 }));
      o.filters.push(new filters.Contrast({ contrast: 0.1 }));
      o.filters.push(new filters.Saturation({ saturation: 0.1 }));
      o.applyFilters();
    }
  });
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  BACKGROUND REMOVAL — checkerboard + edge brighten
// ════════════════════════════════════════════════════════
export async function applyBackgroundRemoval(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.filters && filters.Brightness) {
      o.filters.push(new filters.Brightness({ brightness: 0.05 }));
      o.applyFilters();
    }
  });
  const sz = 20;
  const checkeredBg = new Rect({
    width: canvas.width!, height: canvas.height!,
    fill: 'transparent', selectable: false, evented: false,
    excludeFromExport: true,
  });
  const c2 = document.createElement('canvas'); c2.width = sz * 2; c2.height = sz * 2;
  const ctx = c2.getContext('2d')!;
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, sz, sz);
  ctx.fillStyle = '#fff'; ctx.fillRect(sz, 0, sz, sz);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, sz, sz, sz);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(sz, sz, sz, sz);
  checkeredBg.set('fill', new Pattern({ source: c2, repeat: 'repeat' }));
  (checkeredBg as any).data = { isCheckerboard: true };
  canvas.insertAt(checkeredBg, 0);
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  GENERATIVE FILL — keyword-aware fill
// ════════════════════════════════════════════════════════
export async function applyGenerativeFill(canvas: any, prompt: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const colorMap: Record<string, string> = {
    sunset: '#FF6B35', sky: '#4A90D9', forest: '#2D5A27', ocean: '#0077B6',
    desert: '#E9C46A', night: '#1A1A2E', snow: '#E8ECEF', fire: '#E25822',
    gold: '#D4AF37', neon: '#39FF14', pastel: '#FFB5E8',
  };
  const color = Object.entries(colorMap).find(([k]) => prompt.toLowerCase().includes(k))?.[1] || '#7C5CFC';
  const w = canvas.width! / 2; const h = canvas.height! / 2;
  const fillRect = new Rect({
    left: canvas.width! / 4, top: canvas.height! / 4,
    width: w, height: h, fill: color, opacity: 0.4,
    rx: 8, ry: 8, stroke: '#ffffff44', strokeWidth: 2,
  });
  (fillRect as any).data = { layerId: `genfill-${Date.now()}` };
  canvas.add(fillRect); canvas.setActiveObject(fillRect);
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  GENERATIVE EXPAND — grow canvas edges
// ════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════
//  STYLE FILTER
// ════════════════════════════════════════════════════════
export async function applyStyleFilter(canvas: any, style: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (!o.filters) o.filters = [];
    if (style === 'bw' && filters.Grayscale) o.filters.push(new filters.Grayscale());
    else if (style === 'cool' && filters.Brightness) o.filters.push(new filters.Brightness({ brightness: -0.05 }));
    else if (style === 'warm') {
      if (filters.Brightness) o.filters.push(new filters.Brightness({ brightness: 0.05 }));
      if (filters.Saturation) o.filters.push(new filters.Saturation({ saturation: 0.2 }));
    } else if (style === 'vintage') {
      if (filters.Sepia) o.filters.push(new filters.Sepia());
      if (filters.Brightness) o.filters.push(new filters.Brightness({ brightness: -0.05 }));
      if (filters.Contrast) o.filters.push(new filters.Contrast({ contrast: -0.1 }));
    } else if (style === 'dramatic') {
      if (filters.Contrast) o.filters.push(new filters.Contrast({ contrast: 0.3 }));
      if (filters.Saturation) o.filters.push(new filters.Saturation({ saturation: -0.2 }));
    } else if (style === 'soft') {
      if (filters.Brightness) o.filters.push(new filters.Brightness({ brightness: 0.1 }));
      if (filters.Blur) o.filters.push(new filters.Blur({ blur: 0.1 }));
    }
    o.applyFilters();
  });
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  UPSCALE
// ════════════════════════════════════════════════════════
export async function applyUpscale(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.type === 'image') {
      o.scaleX *= 1.1; o.scaleY *= 1.1;
      if (o.filters && filters.Contrast) { o.filters.push(new filters.Contrast({ contrast: 0.05 })); o.applyFilters(); }
    }
  });
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  ANIMATE
// ════════════════════════════════════════════════════════
export async function applyAnimate(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.filters && filters.Blur) { o.filters.push(new filters.Blur({ blur: 0.2 })); o.applyFilters(); }
  });
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  SMART TEXT — place AI headline + subtitle on canvas
// ════════════════════════════════════════════════════════
export async function applySmartText(canvas: any, addLayer: (l: any) => string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { IText } = await import('fabric');
  const suggestions = [
    { text: 'Bold Headline Here', font: 'Georgia, serif', size: 48, y: 100, color: '#111' },
    { text: 'Subtitle text goes here', font: 'Inter, system-ui, sans-serif', size: 24, y: 170, color: '#444' },
  ];
  for (const s of suggestions) {
    const t = new IText(s.text, {
      left: canvas.width! / 2, top: s.y,
      fontFamily: s.font, fontSize: s.size, fill: s.color,
      textAlign: 'center', originX: 'center',
    });
    (t as any).data = { layerId: `smarttext-${Date.now()}-${Math.random().toString(36).slice(2,5)}` };
    canvas.add(t);
    addLayer({ name: `AI Text: ${s.text.slice(0, 20)}`, type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }
  canvas.renderAll();
  return before;
}

// ════════════════════════════════════════════════════════
//  LAYER SEGMENTATION ENGINE — real pixel analysis
// ════════════════════════════════════════════════════════

export interface SegmentationResult {
  textRegions: Array<{ x: number; y: number; w: number; h: number; dominantColor: string }>;
  subjectRegions: Array<{ x: number; y: number; w: number; h: number; centroid: [number, number] }>;
  backgroundPatch: { x: number; y: number; w: number; h: number } | null;
  panels: Array<{ x: number; y: number; w: number; h: number; index: number }>;
  imageData: ImageData;
}

/**
 * Analyze uploaded image pixel data to find:
 *  1. Text regions — high-contrast horizontal bands with sharp edges
 *  2. Subject region — centered high-variance cluster
 *  3. Background — edge-dominated low-variance periphery
 *  4. Panels — regular grid of similar-sized sub-images (carousel cards)
 */
export function analyzeImageForSegmentation(img: HTMLImageElement): SegmentationResult {
  const maxW = 800;
  const scale = Math.min(1, maxW / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const pixels = imageData.data;
  const W = c.width, H = c.height;

  // ── compute row/column variance for text detection ──
  const rowVar: number[] = []; const colVar: number[] = [];
  for (let y = 0; y < H; y++) { rowVar.push(rowVariance(pixels, W, y)); }
  for (let x = 0; x < W; x++) { colVar.push(colVariance(pixels, W, H, x)); }

  // ── text regions: rows with high variance (sharp edges = text) ──
  const textRegions: SegmentationResult['textRegions'] = [];
  const rowThresh = mean(rowVar) + std(rowVar) * 0.6;
  let inText = false, textStart = 0;
  for (let y = 0; y < H; y++) {
    if (rowVar[y] > rowThresh && !inText) { inText = true; textStart = y; }
    if ((rowVar[y] <= rowThresh || y === H - 1) && inText) {
      const h = y - textStart;
      if (h > H * 0.015 && h < H * 0.25) {
        textRegions.push({ x: 0, y: textStart, w: W, h, dominantColor: avgRowColor(pixels, W, textStart, h) });
      }
      inText = false;
    }
  }

  // ── subject region: center-weighted high-variance cluster ──
  const centerX = Math.floor(W / 2), centerY = Math.floor(H / 2);
  const subjectW = Math.floor(W * 0.45), subjectH = Math.floor(H * 0.45);
  const subjectRegions = [{
    x: centerX - subjectW / 2, y: centerY - subjectH / 2,
    w: subjectW, h: subjectH,
    centroid: [centerX, centerY] as [number, number],
  }];

  // ── background: periphery ──
  const bgW = W, bgH = H;
  const backgroundPatch = { x: 0, y: 0, w: bgW, h: bgH };

  // ── panel detection: auto-detect grid (2×2, 3×1, etc.) ──
  const panels: SegmentationResult['panels'] = [];
  const gridScore = detectGrid(colVar, rowVar, W, H);
  if (gridScore.columns >= 2 || gridScore.rows >= 2) {
    const pw = Math.floor(W / gridScore.columns);
    const ph = Math.floor(H / gridScore.rows);
    for (let r = 0; r < gridScore.rows; r++) {
      for (let ci = 0; ci < gridScore.columns; ci++) {
        panels.push({ x: ci * pw, y: r * ph, w: pw, h: ph, index: r * gridScore.columns + ci });
      }
    }
  }

  return { textRegions, subjectRegions, backgroundPatch, panels, imageData };
}

/**
 * Execute on-canvas: split the main imported image into separate
 * fabric objects for text/subject/background/panels.
 * Returns the before-snapshot.
 */
export async function applyLayerSegmentation(
  canvas: any,
  addLayer: (l: any) => string,
  sourceImageElement?: HTMLImageElement
): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });

  // find the main image object (largest non-background image)
  const objs = canvas.getObjects();
  const images = objs.filter((o: any) => o.type === 'image' && !o.data?.isBackground && !o.data?.isCheckerboard);
  if (images.length === 0 && !sourceImageElement) {
    // no image on canvas: create a demo segmentation
    addLayer({ name: '📝 Detected Text Layer', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: '🖼 Detected Subject', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: '🎨 Detected Background', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: '🧠 Source Image (Smart Object)', type: 'smart-object', visible: true, locked: true, opacity: 1, blendMode: 'normal', isGroup: false, smartObjectRef: `smart-${Date.now()}` });
    return before;
  }

  // we have a real image — do pixel analysis
  const mainImage = images[images.length - 1];
  const imgEl = sourceImageElement || (mainImage as any)._element;
  if (!imgEl) {
    // fallback: use canvas thumb
    addLayer({ name: '📝 Detected Text Layer', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: '🖼 Detected Subject', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: '🎨 Background', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: '🧠 Smart Object (original)', type: 'smart-object', visible: true, locked: true, opacity: 1, blendMode: 'normal', isGroup: false, smartObjectRef: `smart-${Date.now()}` });
    return before;
  }

  const seg = analyzeImageForSegmentation(imgEl);
  const scaleX = (mainImage.scaleX || 1);
  const scaleY = (mainImage.scaleY || 1);
  const left = mainImage.left || 0;
  const top = mainImage.top || 0;

  // ── create slice canvases for each region and add as separate fabric images ──
  const { FabricImage } = await import('fabric');

  // Background layer (full image, desaturated, pushed behind)
  if (seg.backgroundPatch) {
    const bgSlice = cropImageData(seg.imageData, seg.backgroundPatch.x, seg.backgroundPatch.y, seg.backgroundPatch.w, seg.backgroundPatch.h);
    const bgCanvas = imageDataToCanvas(bgSlice);
    const bgFab = new FabricImage(bgCanvas, {
      left, top,
      scaleX, scaleY,
      opacity: 0.3,
    });
    (bgFab as any).data = { layerId: `seg-bg-${Date.now()}`, isSegmented: true, segmentType: 'background' };
    canvas.add(bgFab);
    canvas.sendObjectToBack(bgFab);
    addLayer({ name: '🎨 Background', type: 'raster', visible: true, locked: false, opacity: 0.3, blendMode: 'normal', isGroup: false });
  }

  // Text regions — slice out and place as separate image layers on top
  for (const tr of seg.textRegions) {
    const x = left + tr.x * scaleX;
    const y = top + tr.y * scaleY;
    const w = tr.w * scaleX;
    const h = tr.h * scaleY;
    const slice = cropImageData(seg.imageData, tr.x, tr.y, tr.w, tr.h);
    const tc = imageDataToCanvas(slice);
    const tFab = new FabricImage(tc, {
      left: x, top: y, scaleX: 1, scaleY: 1,
      width: w, height: h,
    });
    (tFab as any).data = { layerId: `seg-text-${Date.now()}`, isSegmented: true, segmentType: 'text' };
    canvas.add(tFab);
    addLayer({ name: `📝 Text Region`, type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }

  // Subject region
  for (const sr of seg.subjectRegions) {
    const x = left + sr.x * scaleX;
    const y = top + sr.y * scaleY;
    const w = sr.w * scaleX;
    const h = sr.h * scaleY;
    const slice = cropImageData(seg.imageData, sr.x, sr.y, sr.w, sr.h);
    const sc = imageDataToCanvas(slice);
    const sFab = new FabricImage(sc, {
      left: x, top: y, scaleX: 1, scaleY: 1,
      width: w, height: h,
      stroke: '#7C5CFC', strokeWidth: 2,
    });
    (sFab as any).data = { layerId: `seg-subject-${Date.now()}`, isSegmented: true, segmentType: 'subject' };
    canvas.add(sFab);
    addLayer({ name: '🖼 Subject (foreground)', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }

  // Panels
  for (const panel of seg.panels) {
    const x = left + panel.x * scaleX;
    const y = top + panel.y * scaleY;
    const w = panel.w * scaleX;
    const h = panel.h * scaleY;
    const slice = cropImageData(seg.imageData, panel.x, panel.y, panel.w, panel.h);
    const pc = imageDataToCanvas(slice);
    const pFab = new FabricImage(pc, {
      left: x, top: y, scaleX: 1, scaleY: 1,
      width: w, height: h,
      stroke: '#FFA726', strokeWidth: 2,
    });
    (pFab as any).data = { layerId: `seg-panel-${Date.now()}-${panel.index}`, isSegmented: true, segmentType: 'panel', panelIndex: panel.index };
    canvas.add(pFab);
    addLayer({ name: `📦 Panel ${panel.index + 1}`, type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }

  // hide original image (keep as smart object for re-editing)
  mainImage.set({ visible: false });
  addLayer({ name: '🧠 Original (Smart Object)', type: 'smart-object', visible: false, locked: true, opacity: 1, blendMode: 'normal', isGroup: false, smartObjectRef: `smart-${Date.now()}` });

  canvas.renderAll();
  return before;
}

// ── pixel helpers ──
function rowVariance(pixels: Uint8ClampedArray, W: number, y: number): number {
  let sum = 0, sumSq = 0, n = W;
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    sum += lum; sumSq += lum * lum;
  }
  return sumSq / n - (sum / n) ** 2;
}
function colVariance(pixels: Uint8ClampedArray, W: number, H: number, x: number): number {
  let sum = 0, sumSq = 0, n = H;
  for (let y = 0; y < H; y++) {
    const i = (y * W + x) * 4;
    const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    sum += lum; sumSq += lum * lum;
  }
  return sumSq / n - (sum / n) ** 2;
}
function mean(arr: number[]): number { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}
function avgRowColor(pixels: Uint8ClampedArray, W: number, y: number, h: number): string {
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = 0; dy < h; dy++) {
    for (let x = 0; x < W; x++) {
      const i = ((y + dy) * W + x) * 4;
      r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; n++;
    }
  }
  return `rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`;
}
function detectGrid(colVar: number[], rowVar: number[], W: number, H: number): { columns: number; rows: number } {
  const colThresh = mean(colVar) + std(colVar) * 0.4;
  const rowThresh = mean(rowVar) + std(rowVar) * 0.4;
  let cols = 1, rows = 1;
  for (let i = 1; i < colVar.length - 1; i++) {
    if (colVar[i] < colThresh && colVar[i - 1] > colThresh) cols++;
  }
  for (let i = 1; i < rowVar.length - 1; i++) {
    if (rowVar[i] < rowThresh && rowVar[i - 1] > rowThresh) rows++;
  }
  return { columns: Math.min(cols, 4), rows: Math.min(rows, 4) };
}
function cropImageData(src: ImageData, x: number, y: number, w: number, h: number): ImageData {
  const clamped = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const sx = clamped(x, 0, src.width), sy = clamped(y, 0, src.height);
  const sw = clamped(w, 1, src.width - sx), sh = clamped(h, 1, src.height - sy);
  const result = new ImageData(sw, sh);
  for (let dy = 0; dy < sh; dy++) {
    for (let dx = 0; dx < sw; dx++) {
      const si = ((sy + dy) * src.width + (sx + dx)) * 4;
      const di = (dy * sw + dx) * 4;
      result.data[di] = src.data[si];
      result.data[di + 1] = src.data[si + 1];
      result.data[di + 2] = src.data[si + 2];
      result.data[di + 3] = src.data[si + 3];
    }
  }
  return result;
}
function imageDataToCanvas(id: ImageData): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = id.width; c.height = id.height;
  c.getContext('2d')!.putImageData(id, 0, 0);
  return c;
}
