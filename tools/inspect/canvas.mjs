// Runs via Playwright addInitScript. Records only an explicitly requested synchronous
// render, on canvases in the current .mx-layer. No clip/kit/engine patch is needed.
export function installCanvasRecorder() {
  const proto = CanvasRenderingContext2D.prototype, states = new WeakMap();
  let active = false, count = 0, truncated = false, unknownClips = 0, current = [];
  const state = ctx => {
    let s = states.get(ctx);
    if (!s) { s = { path: [], complex: false, clip: null, stack: [], boxes: [] }; states.set(ctx,s); current.push([ctx,s]); }
    return s;
  };
  const eligible = ctx => active && ctx.canvas.closest(`.mx-layer[data-clip="${window.__mx.state().clip}"]`);
  const transform = (ctx,x,y,w,h) => {
    const m = ctx.getTransform(), sx = ctx.canvas.width/1600, sy = ctx.canvas.height/900;
    const pts = [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b]) => ({ x:(m.a*a+m.c*b+m.e)/sx, y:(m.b*a+m.d*b+m.f)/sy }));
    const xs = pts.map(p=>p.x), ys=pts.map(p=>p.y);
    return { x:Math.min(...xs), y:Math.min(...ys), w:Math.max(...xs)-Math.min(...xs), h:Math.max(...ys)-Math.min(...ys) };
  };
  const intersect = (a,b) => {
    const x=Math.max(a.x,b.x), y=Math.max(a.y,b.y);
    return {x,y,w:Math.max(0,Math.min(a.x+a.w,b.x+b.w)-x),h:Math.max(0,Math.min(a.y+a.h,b.y+b.h)-y)};
  };
  const paintAlpha = style => {
    if (typeof style !== 'string') return 1;
    if (style === 'transparent') return 0;
    if (/^#[\da-f]{8}$/i.test(style)) return parseInt(style.slice(7,9),16)/255;
    const match = style.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);
    return match ? Number(match[1]) : 1;
  };
  const record = (ctx, b, paint) => {
    if (++count > 2000) { truncated = true; return; }
    const s=state(ctx), visible=s.clip ? intersect(b,s.clip) : b;
    if (visible.w <= 0 || visible.h <= 0) return;
    s.boxes.push({...b,...visible, alpha:ctx.globalAlpha*paintAlpha(paint === 'stroke' ? ctx.strokeStyle : ctx.fillStyle), order:count});
  };
  const wrap = (name, fn) => {
    const original=proto[name];
    proto[name]=function(...args) { const result=original.apply(this,args); if(eligible(this)) fn(this,args); return result; };
  };
  wrap('save',ctx=>{const s=state(ctx); if(s.stack.length>=256) throw new Error('Canvas save depth exceeds 256'); s.stack.push(s.clip);});
  wrap('restore',ctx=>{const s=state(ctx); if(s.stack.length) s.clip=s.stack.pop();});
  wrap('beginPath',ctx=>{const s=state(ctx);s.path=[];s.complex=false;});
  for(const name of ['moveTo','lineTo','arc','arcTo','ellipse','bezierCurveTo','quadraticCurveTo']) wrap(name,ctx=>{state(ctx).complex=true;});
  for(const name of ['rect','roundRect']) wrap(name,(ctx,[x,y,w,h])=>{
    const s=state(ctx); if(s.path.length>=2000){truncated=true;return;}
    s.path.push({...transform(ctx,x,y,w,h),rounded:name==='roundRect'});
  });
  for(const name of ['fillRect','strokeRect']) wrap(name,(ctx,[x,y,w,h])=>{
    const b=transform(ctx,x,y,w,h),paint=name==='fillRect'?'fill':'stroke';
    record(ctx,{...b,kind:'rect',paint,edge:b},paint);
  });
  for(const paint of ['fill','stroke']) wrap(paint,(ctx,args)=>{
    const s=state(ctx);
    if(args[0] instanceof Path2D || s.complex) return;
    for(const b of s.path) record(ctx,{...b,kind:'rect',paint,edge:b},paint);
  });
  wrap('clip',(ctx,args)=>{
    const s=state(ctx);
    if(args[0] instanceof Path2D || s.complex || s.path.length!==1){unknownClips++;return;}
    const b=s.path[0]; s.clip=s.clip?intersect(s.clip,b):b;
  });
  for(const name of ['fillText','strokeText']) wrap(name,(ctx,[text,x,y,maxWidth])=>{
    const m=ctx.measureText(text), scale=maxWidth && m.width>maxWidth ? maxWidth/m.width : 1;
    const b=transform(ctx,x-m.actualBoundingBoxLeft*scale,y-m.actualBoundingBoxAscent,
      (m.actualBoundingBoxLeft+m.actualBoundingBoxRight)*scale,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent);
    record(ctx,{...b,kind:'text',text:String(text).slice(0,500)},name==='strokeText'?'stroke':'fill');
  });
  window.__captureBoxes = t => {
    current=[]; count=0; truncated=false; unknownClips=0;
    // Reset current canvas state so geometry cannot leak from the preceding frame.
    for(const canvas of document.querySelectorAll('.mx-layer canvas')) states.delete(canvas.getContext('2d'));
    active=true;
    try { window.__setTime(t); } finally { active=false; }
    const error=document.querySelector('.mx-error');
    if(error) throw new Error(error.textContent.slice(0,300));
    const boxes=current.flatMap(([,s])=>s.boxes).sort((a,b)=>a.order-b.order);
    return {boxes,truncated,unknownClips};
  };
}
