// All fabric imports are dynamic — loaded on first use
let _f: any = null;
async function getF() { if (!_f) { const m = await import('fabric'); _f = m; } return _f; }

export async function applyAutoEnhance(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { filters } = await getF();
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.filters && filters.Brightness && filters.Contrast && filters.Saturation) {
      o.filters.push(new filters.Brightness({ brightness: 0.08 }));
      o.filters.push(new filters.Contrast({ contrast: 0.1 }));
      o.filters.push(new filters.Saturation({ saturation: 0.1 }));
      o.applyFilters();
    }
  });
  canvas.renderAll(); return before;
}

export async function applyBackgroundRemoval(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { filters, Rect, Pattern } = await getF();
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.filters && filters.Brightness) { o.filters.push(new filters.Brightness({ brightness: 0.05 })); o.applyFilters(); }
  });
  const sz = 20;
  const checkeredBg = new Rect({ width: canvas.width!, height: canvas.height!, fill: 'transparent', selectable: false, evented: false, excludeFromExport: true });
  const c2 = document.createElement('canvas'); c2.width = sz * 2; c2.height = sz * 2;
  const ctx = c2.getContext('2d')!;
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, sz, sz);
  ctx.fillStyle = '#fff'; ctx.fillRect(sz, 0, sz, sz);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, sz, sz, sz);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(sz, sz, sz, sz);
  checkeredBg.set('fill', new Pattern({ source: c2, repeat: 'repeat' }));
  (checkeredBg as any).data = { isCheckerboard: true };
  canvas.insertAt(checkeredBg, 0); canvas.renderAll(); return before;
}

export async function applyGenerativeFill(canvas: any, prompt: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { Rect } = await getF();
  const colorMap: Record<string, string> = { sunset: '#FF6B35', sky: '#4A90D9', forest: '#2D5A27', ocean: '#0077B6', desert: '#E9C46A', night: '#1A1A2E', snow: '#E8ECEF', fire: '#E25822', gold: '#D4AF37', neon: '#39FF14', pastel: '#FFB5E8' };
  const color = Object.entries(colorMap).find(([k]) => prompt.toLowerCase().includes(k))?.[1] || '#7C5CFC';
  const w = canvas.width! / 2, h = canvas.height! / 2;
  const fillRect = new Rect({ left: canvas.width! / 4, top: canvas.height! / 4, width: w, height: h, fill: color, opacity: 0.4, rx: 8, ry: 8, stroke: '#ffffff44', strokeWidth: 2 });
  canvas.add(fillRect); canvas.setActiveObject(fillRect); canvas.renderAll(); return before;
}

export async function applyGenerativeExpand(canvas: any, direction: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const expandBy = 200; const isH = direction === 'horizontal';
  canvas.setWidth(canvas.width! + (isH ? expandBy * 2 : 0));
  canvas.setHeight(canvas.height! + (isH ? 0 : expandBy * 2));
  const bg = canvas.getObjects().find((o: any) => o.data?.isBackground);
  if (bg) bg.set({ width: canvas.width!, height: canvas.height! });
  canvas.renderAll(); return before;
}

export async function applyStyleFilter(canvas: any, style: string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { filters } = await getF();
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (!o.filters) o.filters = [];
    if (style === 'bw' && filters.Grayscale) o.filters.push(new filters.Grayscale());
    else if (style === 'cool' && filters.Brightness) o.filters.push(new filters.Brightness({ brightness: -0.05 }));
    else if (style === 'warm') { if (filters.Brightness) o.filters.push(new filters.Brightness({ brightness: 0.05 })); if (filters.Saturation) o.filters.push(new filters.Saturation({ saturation: 0.2 })); }
    else if (style === 'vintage') { if (filters.Sepia) o.filters.push(new filters.Sepia()); if (filters.Brightness) o.filters.push(new filters.Brightness({ brightness: -0.05 })); if (filters.Contrast) o.filters.push(new filters.Contrast({ contrast: -0.1 })); }
    else if (style === 'dramatic') { if (filters.Contrast) o.filters.push(new filters.Contrast({ contrast: 0.3 })); if (filters.Saturation) o.filters.push(new filters.Saturation({ saturation: -0.2 })); }
    else if (style === 'soft') { if (filters.Brightness) o.filters.push(new filters.Brightness({ brightness: 0.1 })); if (filters.Blur) o.filters.push(new filters.Blur({ blur: 0.1 })); }
    o.applyFilters();
  });
  canvas.renderAll(); return before;
}

export async function applyAnimate(canvas: any): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { filters } = await getF();
  canvas.getObjects().forEach((o: any) => {
    if (o.data?.isBackground || o.data?.isCheckerboard) return;
    if (o.filters && filters.Blur) { o.filters.push(new filters.Blur({ blur: 0.2 })); o.applyFilters(); }
  });
  canvas.renderAll(); return before;
}

export async function applySmartText(canvas: any, addLayer: (l: any) => string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { IText } = await getF();
  const suggestions = [
    { text: 'Bold Headline Here', font: 'system-ui, sans-serif', size: 48, y: 100, color: '#fff' },
    { text: 'Subtitle text goes here', font: 'system-ui, sans-serif', size: 24, y: 170, color: '#888' },
  ];
  for (const s of suggestions) {
    const t = new IText(s.text, { left: canvas.width! / 2, top: s.y, fontFamily: s.font, fontSize: s.size, fill: s.color, textAlign: 'center', originX: 'center' });
    canvas.add(t); addLayer({ name: `AI Text`, type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }
  canvas.renderAll(); return before;
}

// ── Segmentation engine ──
export interface SegmentationResult {
  textRegions: Array<{ x: number; y: number; w: number; h: number; dominantColor: string }>;
  subjectRegions: Array<{ x: number; y: number; w: number; h: number; centroid: [number, number] }>;
  backgroundPatch: { x: number; y: number; w: number; h: number } | null;
  panels: Array<{ x: number; y: number; w: number; h: number; index: number }>;
  imageData: ImageData;
}

export function analyzeImageForSegmentation(img: HTMLImageElement): SegmentationResult {
  const maxW = 800; const scale = Math.min(1, maxW / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, c.width, c.height);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const pixels = imageData.data; const W = c.width, H = c.height;

  const rowVar: number[] = []; for (let y=0;y<H;y++) rowVar.push(rv(pixels,W,y));
  const colVar: number[] = []; for (let x=0;x<W;x++) colVar.push(cv(pixels,W,H,x));

  const textRegions: SegmentationResult['textRegions'] = [];
  const rowThresh = mean(rowVar) + std(rowVar) * 0.6;
  let inText = false, textStart = 0;
  for (let y=0;y<H;y++) {
    if (rowVar[y]>rowThresh&&!inText){inText=true;textStart=y}
    if ((rowVar[y]<=rowThresh||y===H-1)&&inText){const h=y-textStart;if(h>H*.015&&h<H*.25)textRegions.push({x:0,y:textStart,w:W,h,dominantColor:avgColor(pixels,W,textStart,h)});inText=false}
  }

  const cx=Math.floor(W/2),cy=Math.floor(H/2),sw=Math.floor(W*.45),sh=Math.floor(H*.45);
  const subjectRegions=[{x:cx-sw/2,y:cy-sh/2,w:sw,h:sh,centroid:[cx,cy]as[number,number]}];
  const backgroundPatch={x:0,y:0,w:W,h:H};
  const panels:SegmentationResult['panels']=[];
  const gs=detectGrid(colVar,rowVar,W,H);
  if(gs.cols>=2||gs.rows>=2){const pw=Math.floor(W/gs.cols),ph=Math.floor(H/gs.rows);for(let r=0;r<gs.rows;r++)for(let ci=0;ci<gs.cols;ci++)panels.push({x:ci*pw,y:r*ph,w:pw,h:ph,index:r*gs.cols+ci})}

  return {textRegions,subjectRegions,backgroundPatch,panels,imageData};
}

export async function applyLayerSegmentation(canvas: any, addLayer: (l: any) => string, sourceImageElement?: HTMLImageElement): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const objs = canvas.getObjects();
  const images = objs.filter((o: any) => o.type === 'image' && !o.data?.isBackground && !o.data?.isCheckerboard);
  if (images.length === 0 && !sourceImageElement) {
    addLayer({ name: 'Text Layer', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: 'Subject', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: 'Background', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: 'Smart Object (original)', type: 'smart-object', visible: true, locked: true, opacity: 1, blendMode: 'normal', isGroup: false, smartObjectRef: `smart-${Date.now()}` });
    return before;
  }
  const mainImage = images[images.length - 1];
  const imgEl = sourceImageElement || (mainImage as any)._htmlImageElement;
  if (!imgEl) {
    addLayer({ name: 'Text Layer', type: 'text', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: 'Subject', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: 'Background', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    addLayer({ name: 'Smart Object', type: 'smart-object', visible: true, locked: true, opacity: 1, blendMode: 'normal', isGroup: false, smartObjectRef: `smart-${Date.now()}` });
    return before;
  }
  const seg = analyzeImageForSegmentation(imgEl);
  const { Image: FabricImage } = await getF();
  const sX = (mainImage.scaleX||1), sY = (mainImage.scaleY||1), l = mainImage.left||0, t = mainImage.top||0;

  if (seg.backgroundPatch) {
    const bgSlice = cropImageData(seg.imageData, seg.backgroundPatch.x, seg.backgroundPatch.y, seg.backgroundPatch.w, seg.backgroundPatch.h);
    const bgC = id2canvas(bgSlice); const bF = new FabricImage(bgC, { left: l, top: t, scaleX: sX, scaleY: sY, opacity: 0.3 });
    (bF as any).data = { isSegmented: true, segmentType: 'background' };
    canvas.add(bF); canvas.sendObjectToBack(bF);
    addLayer({ name: 'Background', type: 'raster', visible: true, locked: false, opacity: 0.3, blendMode: 'normal', isGroup: false });
  }
  for (const tr of seg.textRegions) {
    const slice = cropImageData(seg.imageData, tr.x, tr.y, tr.w, tr.h);
    const tc = id2canvas(slice);
    const tF = new FabricImage(tc, { left: l+tr.x*sX, top: t+tr.y*sY, scaleX: 1, scaleY: 1, width: tr.w*sX, height: tr.h*sY });
    (tF as any).data = { isSegmented: true, segmentType: 'text' };
    canvas.add(tF); addLayer({ name: 'Text Region', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }
  for (const sr of seg.subjectRegions) {
    const slice = cropImageData(seg.imageData, sr.x, sr.y, sr.w, sr.h);
    const sc = id2canvas(slice);
    const sF = new FabricImage(sc, { left: l+sr.x*sX, top: t+sr.y*sY, scaleX: 1, scaleY: 1, width: sr.w*sX, height: sr.h*sY, stroke: '#7C5CFC', strokeWidth: 2 });
    (sF as any).data = { isSegmented: true, segmentType: 'subject' };
    canvas.add(sF); addLayer({ name: 'Subject', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }
  for (const pn of seg.panels) {
    const slice = cropImageData(seg.imageData, pn.x, pn.y, pn.w, pn.h);
    const pc = id2canvas(slice);
    const pF = new FabricImage(pc, { left: l+pn.x*sX, top: t+pn.y*sY, scaleX: 1, scaleY: 1, width: pn.w*sX, height: pn.h*sY, stroke: '#FFA726', strokeWidth: 2 });
    (pF as any).data = { isSegmented: true, segmentType: 'panel', panelIndex: pn.index };
    canvas.add(pF); addLayer({ name: `Panel ${pn.index+1}`, type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }
  mainImage.set({ visible: false });
  addLayer({ name: 'Original (Smart)', type: 'smart-object', visible: false, locked: true, opacity: 1, blendMode: 'normal', isGroup: false, smartObjectRef: `smart-${Date.now()}` });
  canvas.renderAll(); return before;
}

// ── pixel helpers ──
function rv(p: Uint8ClampedArray, W: number, y: number) { let s=0,s2=0; for(let x=0;x<W;x++){const i=(y*W+x)*4,lum=.299*p[i]+.587*p[i+1]+.114*p[i+2];s+=lum;s2+=lum*lum} return s2/W-(s/W)**2 }
function cv(p: Uint8ClampedArray, W: number, H: number, x: number) { let s=0,s2=0; for(let y=0;y<H;y++){const i=(y*W+x)*4,lum=.299*p[i]+.587*p[i+1]+.114*p[i+2];s+=lum;s2+=lum*lum} return s2/H-(s/H)**2 }
function mean(a: number[]) { return a.reduce((x,b)=>x+b,0)/a.length }
function std(a: number[]) { const m=mean(a); return Math.sqrt(a.reduce((x,b)=>x+(b-m)**2,0)/a.length) }
function avgColor(p: Uint8ClampedArray, W: number, y: number, h: number) { let r=0,g=0,b=0,n=0; for(let dy=0;dy<h;dy++) for(let x=0;x<W;x++){const i=((y+dy)*W+x)*4;r+=p[i];g+=p[i+1];b+=p[i+2];n++} return `rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})` }
function detectGrid(cv2: number[], rv2: number[], W: number, H: number) { const ct=mean(cv2)+std(cv2)*.4,rt=mean(rv2)+std(rv2)*.4; let cols=1,rows=1; for(let i=1;i<cv2.length-1;i++) if(cv2[i]<ct&&cv2[i-1]>ct)cols++; for(let i=1;i<rv2.length-1;i++) if(rv2[i]<rt&&rv2[i-1]>rt)rows++; return {cols:Math.min(cols,4),rows:Math.min(rows,4)} }
function cropImageData(src: ImageData, x: number, y: number, w: number, h: number) { const cl=(v:number,l:number,hi:number)=>Math.max(l,Math.min(hi,v)); const sx=cl(x,0,src.width),sy=cl(y,0,src.height),sw=cl(w,1,src.width-sx),sh=cl(h,1,src.height-sy); const r=new ImageData(sw,sh); for(let dy=0;dy<sh;dy++) for(let dx=0;dx<sw;dx++){const si=((sy+dy)*src.width+(sx+dx))*4,di=(dy*sw+dx)*4;r.data[di]=src.data[si];r.data[di+1]=src.data[si+1];r.data[di+2]=src.data[si+2];r.data[di+3]=src.data[si+3]} return r }
function id2canvas(id: ImageData) { const c=document.createElement('canvas');c.width=id.width;c.height=id.height;c.getContext('2d')!.putImageData(id,0,0);return c }
