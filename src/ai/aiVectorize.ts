// Dynamic fabric import only when needed on canvas

// ════════════════════════════════════════════════════════
//  RASTER-TO-VECTOR TRACING ENGINE
//  Edge detection → contour tracing → SVG path generation
// ════════════════════════════════════════════════════════

interface Point { x: number; y: number; }

/**
 * Canny-style edge detection:
 * 1. Grayscale
 * 2. Gaussian blur
 * 3. Sobel gradient
 * 4. Non-maximum suppression
 * 5. Hysteresis thresholding
 */
function edgeDetect(id: ImageData, lowThresh: number = 30, highThresh: number = 70): Uint8Array {
  const W = id.width, H = id.height;
  const gray = new Float32Array(W * H);
  const edges = new Uint8Array(W * H);
  const grad = new Float32Array(W * H);
  const angle = new Float32Array(W * H);

  // 1. Grayscale
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    gray[i] = 0.299 * id.data[p] + 0.587 * id.data[p + 1] + 0.114 * id.data[p + 2];
  }

  // 2. Gaussian blur 3×3
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;
  const blurred = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * W + (x + dx)] * kernel[(dy + 1) * 3 + (dx + 1)];
        }
      }
      blurred[y * W + x] = sum / kSum;
    }
  }

  // 3. Sobel
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = -blurred[i - W - 1] + blurred[i - W + 1]
                - 2 * blurred[i - 1] + 2 * blurred[i + 1]
                - blurred[i + W - 1] + blurred[i + W + 1];
      const gy = -blurred[i - W - 1] - 2 * blurred[i - W] - blurred[i - W + 1]
                + blurred[i + W - 1] + 2 * blurred[i + W] + blurred[i + W + 1];
      grad[i] = Math.sqrt(gx * gx + gy * gy);
      angle[i] = Math.atan2(gy, gx);
    }
  }

  // 4. Non-maximum suppression
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const a = angle[i];
      let n1 = 0, n2 = 0;
      const dir = ((a + Math.PI) / Math.PI * 4 + 0.5) | 0;
      if (dir === 0 || dir === 4) { n1 = grad[y * W + (x - 1)]; n2 = grad[y * W + (x + 1)]; }
      else if (dir === 1) { n1 = grad[(y - 1) * W + (x + 1)]; n2 = grad[(y + 1) * W + (x - 1)]; }
      else if (dir === 2) { n1 = grad[(y - 1) * W + x]; n2 = grad[(y + 1) * W + x]; }
      else if (dir === 3) { n1 = grad[(y - 1) * W + (x - 1)]; n2 = grad[(y + 1) * W + (x + 1)]; }
      if (grad[i] >= n1 && grad[i] >= n2) edges[i] = grad[i] > highThresh ? 255 : grad[i] > lowThresh ? 128 : 0;
    }
  }

  // 5. Hysteresis
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (edges[i] === 128) {
        let strong = false;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (edges[(y + dy) * W + (x + dx)] === 255) strong = true;
        edges[i] = strong ? 255 : 0;
      }
    }
  }
  return edges;
}

/**
 * Marching Squares contour tracing
 * Returns closed polygons from edge map
 */
function traceContours(edges: Uint8Array, W: number, H: number): Point[][] {
  const visited = new Uint8Array(W * H);
  const contours: Point[][] = [];
  const minLength = 10;

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (edges[i] !== 255 || visited[i]) continue;

      // Moore-Neighbor tracing
      const contour: Point[] = [];
      const startX = x, startY = y;
      let cx = x, cy = y;
      let dir = 7; // start at NW from current position

      do {
        contour.push({ x: cx, y: cy });
        visited[cy * W + cx] = 1;

        // Search in Moore neighborhood
        let found = false;
        for (let d = 0; d < 8; d++) {
          const nd = (dir + d + 5) % 8; // start checking behind, rotate CCW
          const nx = cx + [1, 1, 0, -1, -1, -1, 0, 1][nd];
          const ny = cy + [0, -1, -1, -1, 0, 1, 1, 1][nd];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          if (edges[ny * W + nx] === 255) {
            cx = nx; cy = ny; dir = nd; found = true; break;
          }
        }
        if (!found) break;
        if (contour.length > W * H) break; // safety
      } while (cx !== startX || cy !== startY || contour.length < 2);

      if (contour.length >= minLength) {
        contours.push(simplifyPath(contour, 2.0));
      }
    }
  }
  return contours;
}

/**
 * Ramer–Douglas–Peucker simplification
 */
function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  let maxDist = 0, maxIdx = 0;
  const first = points[0], last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDist(points[i], first, last);
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist < epsilon) return [first, last];
  const left = simplifyPath(points.slice(0, maxIdx + 1), epsilon);
  const right = simplifyPath(points.slice(maxIdx), epsilon);
  return [...left.slice(0, -1), ...right];
}
function perpendicularDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(((a.x + t * dx - p.x) ** 2 + (a.y + t * dy - p.y) ** 2));
}

/**
 * Convert contour points to SVG path data
 */
function contoursToSVGPath(contours: Point[][], W: number, H: number): string {
  let d = '';
  for (const contour of contours) {
    if (contour.length < 2) continue;
    d += `M${contour[0].x},${contour[0].y}`;
    for (let i = 1; i < contour.length; i++) {
      d += `L${contour[i].x},${contour[i].y}`;
    }
    d += 'Z';
  }
  return d;
}

/**
 * Color quantization — reduce image to palette of N colors,
 * return N layers with each color as a separate region
 */
function quantizeColors(id: ImageData, numColors: number = 8): Array<{ color: string; mask: Uint8Array }> {
  const W = id.width, H = id.height;
  const pixels: [number, number, number, number][] = [];
  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    pixels.push([id.data[p], id.data[p + 1], id.data[p + 2], id.data[p + 3]]);
  }

  // Simple k-means (k-medians for speed)
  const clusters: [number, number, number][] = [];
  for (let k = 0; k < numColors; k++) {
    clusters.push([pixels[Math.floor(k * pixels.length / numColors)][0],
    pixels[Math.floor(k * pixels.length / numColors)][1],
    pixels[Math.floor(k * pixels.length / numColors)][2]]);
  }

  // 3 iterations
  for (let iter = 0; iter < 3; iter++) {
    const sums: [number, number, number, number][] = clusters.map(() => [0, 0, 0, 0]);
    for (const p of pixels) {
      if (p[3] < 128) continue; // skip transparent
      let bestK = 0, bestD = Infinity;
      for (let k = 0; k < clusters.length; k++) {
        const d = (p[0] - clusters[k][0]) ** 2 + (p[1] - clusters[k][1]) ** 2 + (p[2] - clusters[k][2]) ** 2;
        if (d < bestD) { bestD = d; bestK = k; }
      }
      sums[bestK][0] += p[0]; sums[bestK][1] += p[1]; sums[bestK][2] += p[2]; sums[bestK][3] += 1;
    }
    for (let k = 0; k < clusters.length; k++) {
      if (sums[k][3] > 0) {
        clusters[k] = [Math.round(sums[k][0] / sums[k][3]), Math.round(sums[k][1] / sums[k][3]), Math.round(sums[k][2] / sums[k][3])];
      }
    }
  }

  // Build masks
  const results = clusters.map((c, k) => ({
    color: `#${c[0].toString(16).padStart(2, '0')}${c[1].toString(16).padStart(2, '0')}${c[2].toString(16).padStart(2, '0')}`,
    mask: new Uint8Array(W * H),
  }));

  for (let i = 0; i < W * H; i++) {
    const p = i * 4;
    if (pixels[i][3] < 128) continue;
    let bestK = 0, bestD = Infinity;
    for (let k = 0; k < clusters.length; k++) {
      const d = (pixels[i][0] - clusters[k][0]) ** 2 + (pixels[i][1] - clusters[k][1]) ** 2 + (pixels[i][2] - clusters[k][2]) ** 2;
      if (d < bestD) { bestD = d; bestK = k; }
    }
    results[bestK].mask[i] = 1;
  }
  return results;
}

/**
 * MAIN: Convert raster image on canvas to SVG vector objects
 * Returns full SVG document string
 */
export async function rasterToVector(
  canvas: any,
  mode: 'outline' | 'color-layers' | 'both' = 'both',
  numColors: number = 6,
): Promise<{ svg: string; before: string }> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });

  // Get full canvas image data
  const offCanvas = document.createElement('canvas');
  offCanvas.width = canvas.width!;
  offCanvas.height = canvas.height!;
  const ctx = offCanvas.getContext('2d')!;

  // Draw all non-checkerboard objects
  const objects = canvas.getObjects().filter((o: any) => !o.data?.isCheckerboard);
  const oldVisible = objects.map((o: any) => o.visible);
  objects.forEach((o: any) => o.set({ visible: true }));
  canvas.renderAll();

  const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
  const img = await new Promise<HTMLImageElement>(r => { const i = new Image(); i.onload = () => r(i); i.src = dataURL; });
  ctx.drawImage(img, 0, 0);

  // Restore
  objects.forEach((o: any, i: number) => o.set({ visible: oldVisible[i] }));
  canvas.renderAll();

  const imageData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);

  let svgParts: string[] = [];
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${offCanvas.width}" height="${offCanvas.height}" viewBox="0 0 ${offCanvas.width} ${offCanvas.height}">`);

  if (mode === 'outline' || mode === 'both') {
    const edges = edgeDetect(imageData, 25, 60);
    const contours = traceContours(edges, offCanvas.width, offCanvas.height);
    const pathData = contoursToSVGPath(contours, offCanvas.width, offCanvas.height);
    svgParts.push(`<path d="${pathData}" fill="none" stroke="#000000" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  if (mode === 'color-layers' || mode === 'both') {
    const layers = quantizeColors(imageData, Math.max(2, Math.min(numColors, 16)));
    for (const layer of layers) {
      // For each color layer, trace its mask as a closed path or rectangle set
      const edges = new Uint8Array(offCanvas.width * offCanvas.height);
      for (let i = 0; i < offCanvas.width * offCanvas.height; i++) {
        // Edge of mask region
        const y = Math.floor(i / offCanvas.width), x = i % offCanvas.width;
        let isEdge = layer.mask[i] === 1;
        if (isEdge) {
          let border = false;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              if (dx !== 0 || dy !== 0) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= offCanvas.width || ny >= offCanvas.height) { border = true; continue; }
                if (layer.mask[ny * offCanvas.width + nx] !== 1) border = true;
              }
          edges[i] = border ? 255 : 0;
        }
      }

      const contours = traceContours(edges, offCanvas.width, offCanvas.height);
      if (contours.length > 0) {
        const pathData = contoursToSVGPath(contours, offCanvas.width, offCanvas.height);
        svgParts.push(`<path d="${pathData}" fill="${layer.color}" stroke="${layer.color}" stroke-width="0.5"/>`);
      }
    }
  }

  svgParts.push('</svg>');
  const svg = svgParts.join('\n');
  return { svg, before };
}

/**
 * Place SVG paths directly onto the Fabric.js canvas as vector objects
 */
export async function rasterToCanvasVectors(
  canvas: any,
  addLayer: (l: any) => string,
  mode: 'outline' | 'color-layers' | 'both' = 'both',
  numColors: number = 6,
): Promise<string> {
  const { svg } = await rasterToVector(canvas, mode, numColors);
  const before = canvas.toDataURL({ format: 'png', quality: 1 });
  const { Path } = await import('fabric');

  // Parse SVG path data and create fabric Path objects
  const pathRegex = /<path\s+d="([^"]*)"\s+fill="([^"]*)"\s+stroke="([^"]*)"[^>]*\/>/g;
  let match;
  let layerCount = 0;

  while ((match = pathRegex.exec(svg)) !== null) {
    const d = match[1];
    const fill = match[2] || 'none';
    const stroke = match[3] || '#000';

    try {
      const path = new Path(d, {
        fill: fill === 'none' ? 'transparent' : fill,
        stroke: fill === 'none' ? stroke : 'transparent',
        strokeWidth: fill === 'none' ? 1.5 : 0,
        selectable: true,
        evented: true,
      });
      (path as any).data = { layerId: `vector-${Date.now()}-${layerCount}`, isVectorized: true };
      canvas.add(path);

      if (fill === 'none') {
        addLayer({ name: `✏️ Outline Path`, type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      } else {
        addLayer({ name: `🎨 Color Shape ${fill}`, type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      }
      layerCount++;
    } catch { /* skip malformed paths */ }
  }

  if (layerCount === 0) {
    // Fallback: if no paths parsed, try the outline-only approach
    const outlineMatch = /<path\s+d="([^"]*)"/.exec(svg);
    if (outlineMatch) {
      const path = new Path(outlineMatch[1], {
        fill: 'transparent', stroke: '#000', strokeWidth: 1.5,
        selectable: true, evented: true,
      });
      (path as any).data = { layerId: `vector-${Date.now()}`, isVectorized: true };
      canvas.add(path);
      addLayer({ name: '✏️ Vector Outline', type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
      layerCount++;
    }
  }

  // Generate downloadable SVG
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vectorized-${Date.now()}.svg`;
  link.click();

  if (layerCount === 0) {
    addLayer({ name: '✏️ Vector Trace (simplified)', type: 'vector', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }

  canvas.renderAll();
  return before;
}
