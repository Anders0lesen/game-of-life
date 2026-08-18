export function parseRule(text) {
  if (typeof text !== 'string') throw new TypeError('Rule must be a string');
  if (!/^[0-8]*$/.test(text)) throw new Error(`Invalid rule: ${text}`);
  return new Set([...text].map(Number));
}

export function nextGeneration(grid, cols, rows, birthRule = '3', survivalRule = '23') {
  if (!(grid instanceof Uint8Array)) throw new TypeError('grid must be a Uint8Array');
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) {
    throw new Error('cols and rows must be positive integers');
  }
  if (grid.length !== cols * rows) {
    throw new Error(`grid size ${grid.length} does not match ${cols}x${rows}`);
  }

  const birth = parseRule(birthRule);
  const survive = parseRule(survivalRule);
  const next = new Uint8Array(grid.length);
  const key = (x, y) => y * cols + x;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let neighbours = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            neighbours += grid[key(nx, ny)];
          }
        }
      }

      const alive = grid[key(x, y)] === 1;
      next[key(x, y)] = alive ? Number(survive.has(neighbours)) : Number(birth.has(neighbours));
    }
  }

  return next;
}

export function population(grid) {
  if (!(grid instanceof Uint8Array)) throw new TypeError('grid must be a Uint8Array');
  let total = 0;
  for (const value of grid) total += value;
  return total;
}
