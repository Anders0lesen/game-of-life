export function radialLayout(itemCount, anchorX, anchorY, viewportWidth, viewportHeight) {
  if (!Number.isInteger(itemCount) || itemCount < 1) throw new Error('itemCount must be a positive integer');
  for (const [name, value] of Object.entries({ anchorX, anchorY, viewportWidth, viewportHeight })) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  }
  if (viewportWidth <= 0 || viewportHeight <= 0) throw new Error('viewport dimensions must be positive');

  const centreAngle = Math.atan2(viewportHeight / 2 - anchorY, viewportWidth / 2 - anchorX);
  const positions = [];
  let remaining = itemCount, offset = 0, ringIndex = 0;

  // Add rings as the toolbox grows instead of silently piling icons on top of each other.
  while (remaining > 0) {
    const capacity = 6 + ringIndex * 4;
    const count = Math.min(capacity, remaining);
    const radius = 78 + ringIndex * 58;
    const span = Math.min(Math.PI * (0.78 + ringIndex * 0.14), Math.PI * 1.45);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = centreAngle - span / 2 + t * span;
      positions[offset + i] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }
    remaining -= count;
    offset += count;
    ringIndex++;
  }

  const margin = 26;
  return positions.map(({ x, y }) => ({
    x: Math.max(margin - anchorX, Math.min(viewportWidth - margin - anchorX, x)),
    y: Math.max(margin - anchorY, Math.min(viewportHeight - margin - anchorY, y))
  }));
}
