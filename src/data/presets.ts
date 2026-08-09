import { PlatformPreset } from '../types/editor';

export const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: 'ig-square', name: 'Instagram Feed (Square)', platform: 'Instagram', width: 1080, height: 1080 },
  { id: 'ig-portrait', name: 'Instagram Feed (Portrait)', platform: 'Instagram', width: 1080, height: 1350 },
  { id: 'ig-story', name: 'Instagram Story / Reel', platform: 'Instagram', width: 1080, height: 1920, safeZone: { top: 250, right: 0, bottom: 0, left: 0 } },
  { id: 'fb-feed', name: 'Facebook Feed', platform: 'Facebook', width: 1200, height: 630 },
  { id: 'fb-cover', name: 'Facebook Cover', platform: 'Facebook', width: 1640, height: 624 },
  { id: 'fb-story', name: 'Facebook Story', platform: 'Facebook', width: 1080, height: 1920 },
  { id: 'x-feed', name: 'X / Twitter Feed', platform: 'X', width: 1200, height: 675 },
  { id: 'x-header', name: 'X / Twitter Header', platform: 'X', width: 1500, height: 500 },
  { id: 'li-feed', name: 'LinkedIn Feed', platform: 'LinkedIn', width: 1200, height: 627 },
  { id: 'li-cover', name: 'LinkedIn Cover', platform: 'LinkedIn', width: 1584, height: 396 },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', platform: 'YouTube', width: 1280, height: 720 },
  { id: 'tk-video', name: 'TikTok Video', platform: 'TikTok', width: 1080, height: 1920 },
  { id: 'wa-status', name: 'WhatsApp Status', platform: 'WhatsApp', width: 1080, height: 1920 },
  { id: 'custom', name: 'Custom Size...', platform: 'Custom', width: 1200, height: 800 },
];

export const EXPORT_FORMATS = [
  { id: 'png', label: 'PNG', ext: '.png', raster: true, alpha: true },
  { id: 'jpg', label: 'JPEG', ext: '.jpg', raster: true, alpha: false },
  { id: 'webp', label: 'WebP', ext: '.webp', raster: true, alpha: true },
  { id: 'svg', label: 'SVG', ext: '.svg', raster: false, alpha: true },
  { id: 'pdf', label: 'PDF', ext: '.pdf', raster: false, alpha: false },
  { id: 'gif', label: 'GIF', ext: '.gif', raster: true, alpha: true },
  { id: 'tiff', label: 'TIFF', ext: '.tiff', raster: true, alpha: true },
];

export const TOOLS = [
  { id: 'select' as const, icon: '↖', label: 'Select (V)', group: 'basic' },
  { id: 'move' as const, icon: '✥', label: 'Move (M)', group: 'basic' },
  { id: 'rect' as const, icon: '▭', label: 'Rectangle (R)', group: 'shape' },
  { id: 'ellipse' as const, icon: '○', label: 'Ellipse (E)', group: 'shape' },
  { id: 'line' as const, icon: '╲', label: 'Line (L)', group: 'shape' },
  { id: 'text' as const, icon: 'T', label: 'Text (T)', group: 'basic' },
  { id: 'pen' as const, icon: '✎', label: 'Pen (P)', group: 'vector' },
  { id: 'shape-builder' as const, icon: '◈', label: 'Shape Builder (U)', group: 'vector' },
  { id: 'brush' as const, icon: '🖌', label: 'Brush (B)', group: 'raster' },
  { id: 'fill' as const, icon: '🪣', label: 'Fill (G)', group: 'raster' },
  { id: 'gradient' as const, icon: '◧', label: 'Gradient', group: 'raster' },
  { id: 'eraser' as const, icon: '⌫', label: 'Eraser', group: 'raster' },
  { id: 'clone' as const, icon: '◎', label: 'Clone Stamp (S)', group: 'raster' },
  { id: 'healing' as const, icon: '🩹', label: 'Healing Brush (H)', group: 'raster' },
  { id: 'magic-wand' as const, icon: '🪄', label: 'Magic Wand (W)', group: 'select' },
  { id: 'lasso' as const, icon: '⭝', label: 'Lasso', group: 'select' },
  { id: 'marquee' as const, icon: '⬜', label: 'Marquee', group: 'select' },
];

export const AI_FEATURES = [
  { id: 'background-remove' as const, icon: '🎯', label: 'Background Removal', desc: 'AI matting & segmentation' },
  { id: 'auto-enhance' as const, icon: '✨', label: 'Auto Enhance', desc: 'One-click color, exposure & sharpness' },
  { id: 'generative-fill' as const, icon: '🧩', label: 'Generative Fill', desc: 'Text-prompt or context-aware fill' },
  { id: 'generative-expand' as const, icon: '⬍', label: 'Generative Expand', desc: 'Extend canvas edges with AI' },
  { id: 'style-filter' as const, icon: '🎨', label: 'Style Filters', desc: 'B&W, cool/warm tones, vintage, LUTs' },
  { id: 'upscale-4x' as const, icon: '🔍', label: 'Upscale 4× (Lanczos)', desc: 'Bicubic upscale + sharpen + denoise' },
  { id: 'vectorize' as const, icon: '🔷', label: 'Raster → SVG Vector', desc: 'Edge trace + color quantization' },
  { id: 'layer-segment' as const, icon: '🧱', label: 'Auto Layer Segmentation', desc: 'Pixel analysis → text·subject·bg·panels' },
  { id: 'smart-text' as const, icon: '💬', label: 'Smart Text', desc: 'AI headline, caption & font suggestions' },
  { id: 'animate' as const, icon: '▶', label: 'Animate', desc: 'Generate motion from static image' },
];
