// Both sides of the join use the same background, geometry and color.
export function bar(stage) {
  const { ctx } = stage.canvas();
  return fraction => {
    ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, stage.W, stage.H);
    ctx.fillStyle = '#ff6a3d'; ctx.fillRect(100, 400, 1400 * fraction, 100);
  };
}
