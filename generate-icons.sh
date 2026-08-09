# Generate 192x192 and 512x512 PNG icons via canvas in Node
node -e "
const { createCanvas } = (() => { try { return require('canvas'); } catch { return { createCanvas: null }; } })();
if (createCanvas) {
  [192,512].forEach(s => {
    const c = createCanvas(s,s);
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,s,s);
    grad.addColorStop(0,'#6C3CE0'); grad.addColorStop(1,'#9B7CFC');
    ctx.fillStyle = grad; ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(0,0,s,s,s*0.22) : ctx.rect(0,0,s,s);
    ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold '+(s*0.45)+'px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('D', s/2, s/2);
    require('fs').writeFileSync('public/icon-'+s+'.png', c.toBuffer('image/png'));
  });
  console.log('Icons created');
} else {
  // fallback: simple SVG
  [192,512].forEach(s => {
    const svg = '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"'+s+'\" height=\"'+s+'\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0%\" stop-color=\"#6C3CE0\"/><stop offset=\"100%\" stop-color=\"#9B7CFC\"/></linearGradient></defs><rect width=\"'+s+'\" height=\"'+s+'\" rx=\"'+(s*0.22)+'\" fill=\"url(#g)\"/><text x=\"'+s/2+'\" y=\"'+s/2+'\" text-anchor=\"middle\" dominant-baseline=\"central\" font-family=\"system-ui\" font-weight=\"700\" font-size=\"'+(s*0.45)+'\" fill=\"white\">D</text></svg>';
    require('fs').writeFileSync('public/icon-'+s+'.svg', svg);
  });
  console.log('SVG icons created (no canvas module)');
}
"
