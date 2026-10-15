// Shared endpoints keep the cut join pixel-identical.
export function drawGroup(stage, ctx, value) {
  ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, stage.W, stage.H);
  ctx.fillStyle = '#dba25d';
  ctx.fillRect(200, 400, 1200 * value, 100);
}
