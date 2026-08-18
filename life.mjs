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

export function gridsEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
    throw new TypeError('grids must be Uint8Array values');
  }
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function findRepeatPeriod(current, previousStates, maxLookback = 3) {
  if (!(current instanceof Uint8Array)) throw new TypeError('current must be a Uint8Array');
  if (!Array.isArray(previousStates)) throw new TypeError('previousStates must be an array');
  if (!Number.isInteger(maxLookback) || maxLookback < 1) {
    throw new Error('maxLookback must be a positive integer');
  }

  const start = Math.max(0, previousStates.length - maxLookback);
  for (let i = previousStates.length - 1; i >= start; i--) {
    if (gridsEqual(current, previousStates[i])) {
      return previousStates.length - i;
    }
  }
  return 0;
}
