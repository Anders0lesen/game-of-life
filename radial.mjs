export function radialLayout(itemCount, anchorX, anchorY, viewportWidth, viewportHeight) {
  if (!Number.isInteger(itemCount) || itemCount < 1) throw new Error('itemCount must be a positive integer');
  for (const [name, value] of Object.entries({ anchorX, anchorY, viewportWidth, viewportHeight })) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  }
  if (viewportWidth <= 0 || viewportHeight <= 0) throw new Error('viewport dimensions must be positive');
  const centreAngle = Math.atan2(viewportHeight / 2 - anchorY, viewportWidth / 2 - anchorX);
  const innerCount = Math.min(6, itemCount);
  const outerCount = itemCount - innerCount;
  const positions = [];
  const ring = (count, radius, span, offset) => {
    if (!count) return;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = centreAngle - span / 2 + t * span;
      positions[offset + i] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }
  };
  ring(innerCount, 78, Math.PI * 0.78, 0);
  ring(outerCount, 136, Math.PI * 0.92, innerCount);
  const margin = 26;
  return positions.map(({ x, y }) => ({
    x: Math.max(margin - anchorX, Math.min(viewportWidth - margin - anchorX, x)),
    y: Math.max(margin - anchorY, Math.min(viewportHeight - margin - anchorY, y))
  }));
}
