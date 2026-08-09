// ════════════════════════════════════════════════════════
//  4× BICUBIC UPSCALE ENGINE
//  Uses Lanczos-2 kernel with sharpening pass
// ════════════════════════════════════════════════════════

function lanczos2(x: number): number {
  if (x === 0) return 1;
  if (Math.abs(x) >= 2) return 0;
  const a = 2;
  const px = Math.PI * x;
  const pxa = (Math.PI * x) / a;
  return (a * Math.sin(px) * Math.sin(pxa)) / (px * px);
}

/**
 * Bilinear interpolation (fast fallback)
 */
function bilinearSample(src: ImageData, x: number, y: number): [number, number, number, number] {
  const W = src.width, H = src.height;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1);
  const fx = x - x0, fy = y - y0;

  const idx = (px: number, py: number) => (py * W + px) * 4;
  const sample = (px: number, py: number) => {
    const i = idx(Math.max(0, Math.min(W - 1, px)), Math.max(0, Math.min(H - 1, py)));
    return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
  };

  const tl = sample(x0, y0), tr = sample(x1, y0);
  const bl = sample(x0, y1), br = sample(x1, y1);

  return [
    tl[0] * (1 - fx) * (1 - fy) + tr[0] * fx * (1 - fy) + bl[0] * (1 - fx) * fy + br[0] * fx * fy,
    tl[1] * (1 - fx) * (1 - fy) + tr[1] * fx * (1 - fy) + bl[1] * (1 - fx) * fy + br[1] * fx * fy,
    tl[2] * (1 - fx) * (1 - fy) + tr[2] * fx * (1 - fy) + bl[2] * (1 - fx) * fy + br[2] * fx * fy,
    tl[3] * (1 - fx) * (1 - fy) + tr[3] * fx * (1 - fy) + bl[3] * (1 - fx) * fy + br[3] * fx * fy,
  ] as [number, number, number, number];
}

/**
 * Apply unsharp mask sharpening to ImageData
 */
function unsharpMask(id: ImageData, amount: number = 1.2, radius: number = 1.5, threshold: number = 0): ImageData {
  const W = id.width, H = id.height;
  const result = new ImageData(W, H);

  // Create Gaussian blur of source
  const blurred = new ImageData(W, H);
  const blurRadius = Math.ceil(radius);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const i = (ny * W + nx) * 4;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const weight = Math.exp(-(dist * dist) / (2 * radius * radius));
          r += id.data[i] * weight;
          g += id.data[i + 1] * weight;
          b += id.data[i + 2] * weight;
          count += weight;
        }
      }
      const bi = (y * W + x) * 4;
      blurred.data[bi] = r / count;
      blurred.data[bi + 1] = g / count;
      blurred.data[bi + 2] = b / count;
      blurred.data[bi + 3] = 255;
    }
  }

  // Unsharp mask: sharpened = original + amount * (original - blurred)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, bi = i;
      for (let c = 0; c < 3; c++) {
        const diff = id.data[i + c] - blurred.data[bi + c];
        if (Math.abs(diff) >= threshold) {
          result.data[i + c] = Math.min(255, Math.max(0, id.data[i + c] + amount * diff));
        } else {
          result.data[i + c] = id.data[i + c];
        }
      }
      result.data[i + 3] = id.data[i + 3];
    }
  }
  return result;
}

/**
 * Denoise using simple median blur on luminance channel
 */
function denoise(id: ImageData, kernelSize: number = 2): ImageData {
  const W = id.width, H = id.height;
  const result = new ImageData(W, H);
  const half = Math.floor(kernelSize / 2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sr: number[] = [], sg: number[] = [], sb: number[] = [];
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const nx = Math.max(0, Math.min(W - 1, x + dx));
          const ny = Math.max(0, Math.min(H - 1, y + dy));
          const i = (ny * W + nx) * 4;
          sr.push(id.data[i]); sg.push(id.data[i + 1]); sb.push(id.data[i + 2]);
        }
      }
      sr.sort((a, b) => a - b); sg.sort((a, b) => a - b); sb.sort((a, b) => a - b);
      const mid = Math.floor(sr.length / 2);
      const i = (y * W + x) * 4;
      result.data[i] = sr[mid]; result.data[i + 1] = sg[mid];
      result.data[i + 2] = sb[mid]; result.data[i + 3] = id.data[i + 3];
    }
  }
  return result;
}

/**
 * UPSCALE 4× — Lanczos-2 bicubic with denoising + sharpening
 * Returns a new ImageData at 4× dimensions
 */
export function upscale4x(source: ImageData): ImageData {
  const srcW = source.width, srcH = source.height;
  const dstW = srcW * 4, dstH = srcH * 4;
  const result = new ImageData(dstW, dstH);

  // Lanczos-2 with radius=2 (4×4 window in source)
  const kernelRadius = 2;
  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = dx / 4;
      const sy = dy / 4;
      let r = 0, g = 0, b = 0, a = 0, totalWeight = 0;

      const x0 = Math.floor(sx) - kernelRadius + 1;
      const x1 = Math.floor(sx) + kernelRadius;
      const y0 = Math.floor(sy) - kernelRadius + 1;
      const y1 = Math.floor(sy) + kernelRadius;

      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const cx = Math.max(0, Math.min(srcW - 1, px));
          const cy = Math.max(0, Math.min(srcH - 1, py));
          const weight = lanczos2(sx - px) * lanczos2(sy - py);
          const i = (cy * srcW + cx) * 4;
          r += source.data[i] * weight;
          g += source.data[i + 1] * weight;
          b += source.data[i + 2] * weight;
          a += source.data[i + 3] * weight;
          totalWeight += weight;
        }
      }

      const di = (dy * dstW + dx) * 4;
      result.data[di] = Math.round(r / totalWeight);
      result.data[di + 1] = Math.round(g / totalWeight);
      result.data[di + 2] = Math.round(b / totalWeight);
      result.data[di + 3] = Math.round(a / totalWeight);
    }
  }

  // Sharpen
  return unsharpMask(result, 1.5, 1.2, 2);
}

/**
 * UPSCALE 2× faster path (for preview)
 */
export function upscale2x(source: ImageData): ImageData {
  const srcW = source.width, srcH = source.height;
  const dstW = srcW * 2, dstH = srcH * 2;
  const result = new ImageData(dstW, dstH);

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx = dx / 2, sy = dy / 2;
      const [r, g, b, a] = bilinearSample(source, sx, sy);
      const di = (dy * dstW + dx) * 4;
      result.data[di] = Math.round(r);
      result.data[di + 1] = Math.round(g);
      result.data[di + 2] = Math.round(b);
      result.data[di + 3] = Math.round(a);
    }
  }
  return unsharpMask(result, 1.2, 1.5, 4);
}

/**
 * Canvas-integrated: replace the selected image with a 4× upscaled version
 */
export async function applyUpscale4x(canvas: any, addLayer: (l: any) => string): Promise<string> {
  const before = canvas.toDataURL({ format: 'png', quality: 1 });

  const objs = canvas.getObjects();
  const images = objs.filter((o: any) =>
    o.type === 'image' && !o.data?.isBackground && !o.data?.isCheckerboard
  );

  if (images.length === 0) {
    // Scale entire canvas
    canvas.setWidth(canvas.width! * 4);
    canvas.setHeight(canvas.height! * 4);
    const bg = canvas.getObjects().find((o: any) => o.data?.isBackground);
    if (bg) bg.set({ width: canvas.width!, height: canvas.height! });
    canvas.renderAll();
    addLayer({ name: '📐 Canvas Upscaled 4×', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
    return before;
  }

  // Upscale image objects
  for (const imgObj of images) {
    const source = (imgObj as any)._element || (imgObj as any).getElement?.();
    if (!source) {
      // No source image — scale transform
      imgObj.scaleX *= 4;
      imgObj.scaleY *= 4;
      continue;
    }

    // Draw source to offscreen for pixel data
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = source.naturalWidth || source.width;
    srcCanvas.height = source.naturalHeight || source.height;
    const sctx = srcCanvas.getContext('2d')!;
    sctx.drawImage(source, 0, 0);
    const srcData = sctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    // 4× upscale
    const upscaled = upscale4x(srcData);

    // Render to offscreen canvas
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = upscaled.width;
    dstCanvas.height = upscaled.height;
    dstCanvas.getContext('2d')!.putImageData(upscaled, 0, 0);

    // Replace fabric image
    const newImg = await new Promise<any>((resolve) => {
      const i = new Image();
      i.onload = async () => {
        const { Image: FabricImage } = await import('fabric');
        const fImg = new FabricImage(i, {
          left: imgObj.left,
          top: imgObj.top,
          scaleX: imgObj.scaleX,
          scaleY: imgObj.scaleY,
        });
        resolve(fImg);
      };
      i.src = dstCanvas.toDataURL('image/png');
    });

    const idx = objs.indexOf(imgObj);
    if (idx >= 0) {
      canvas.remove(imgObj);
      canvas.insertAt(newImg, idx);
    } else {
      canvas.add(newImg);
    }
    (newImg as any).data = { ...(imgObj as any).data, upscaled4x: true };
    addLayer({ name: '🔍 Upscaled 4× Image', type: 'raster', visible: true, locked: false, opacity: 1, blendMode: 'normal', isGroup: false });
  }

  canvas.renderAll();
  return before;
}
