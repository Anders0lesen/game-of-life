import { nextGeneration } from './life.mjs';

function assertGrid(grid, cols, rows) {
  if (!(grid instanceof Uint8Array)) throw new TypeError('grid must be a Uint8Array');
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) {
    throw new Error('cols and rows must be positive integers');
  }
  if (grid.length !== cols * rows) throw new Error(`grid size ${grid.length} does not match ${cols}x${rows}`);
}

function normalize(points) {
  const minX = Math.min(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  return points
    .map(([x, y]) => [x - minX, y - minY])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function signature(points) {
  return normalize(points).map(([x, y]) => `${x},${y}`).join(';');
}

function transform(points, rotation, mirror) {
  return points.map(([x, y]) => {
    let tx = mirror ? -x : x;
    let ty = y;
    for (let i = 0; i < rotation; i++) [tx, ty] = [-ty, tx];
    return [tx, ty];
  });
}

function variants(points) {
  const result = new Set();
  for (let mirror = 0; mirror < 2; mirror++) {
    for (let rotation = 0; rotation < 4; rotation++) {
      result.add(signature(transform(points, rotation, mirror)));
    }
  }
  return result;
}

function pointsFromRows(rows) {
  const points = [];
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === '#') points.push([x, y]);
  }));
  return points;
}

function evolvePoints(points, steps) {
  const padding = 6;
  const normalized = normalize(points);
  const width = Math.max(...normalized.map(([x]) => x)) + 1 + padding * 2;
  const height = Math.max(...normalized.map(([, y]) => y)) + 1 + padding * 2;
  let grid = new Uint8Array(width * height);
  for (const [x, y] of normalized) grid[(y + padding) * width + x + padding] = 1;

  for (let step = 0; step < steps; step++) grid = nextGeneration(grid, width, height);

  const evolved = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) if (grid[y * width + x]) evolved.push([x, y]);
  }
  return normalize(evolved);
}

function makePattern(name, rows, period = 1) {
  const seed = pointsFromRows(rows);
  const signatures = new Set();
  for (let phase = 0; phase < period; phase++) {
    for (const value of variants(evolvePoints(seed, phase))) signatures.add(value);
  }
  return { name, signatures };
}

const KNOWN_PATTERNS = [
  makePattern('Block', ['##', '##']),
  makePattern('Blinker', ['###'], 2),
  makePattern('Glider', ['.#.', '..#', '###'], 4),
  makePattern('Toad', ['.###', '###.'], 2),
  makePattern('Beacon', ['##..', '##..', '..##', '..##'], 2),
  makePattern('Beehive', ['.##.', '#..#', '.##.']),
  makePattern('Loaf', ['.##.', '#..#', '.#.#', '..#.']),
  makePattern('Boat', ['##.', '#.#', '.#.'])
];

function connectedComponents(grid, cols, rows) {
  const seen = new Uint8Array(grid.length);
  const components = [];
  const index = (x, y) => y * cols + x;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const start = index(x, y);
      if (!grid[start] || seen[start]) continue;

      const queue = [[x, y]];
      const component = [];
      seen[start] = 1;

      while (queue.length) {
        const [cx, cy] = queue.pop();
        component.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
            const ni = index(nx, ny);
            if (grid[ni] && !seen[ni]) {
              seen[ni] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }
      components.push(component);
    }
  }
  return components;
}

export function recognizePatterns(grid, cols, rows) {
  assertGrid(grid, cols, rows);
  const counts = new Map();

  for (const component of connectedComponents(grid, cols, rows)) {
    const value = signature(component);
    const match = KNOWN_PATTERNS.find(pattern => pattern.signatures.has(value));
    if (match) counts.set(match.name, (counts.get(match.name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function knownPatternNames() {
  return KNOWN_PATTERNS.map(pattern => pattern.name);
}
