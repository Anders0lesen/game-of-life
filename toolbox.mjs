const RAW_PATTERNS = {
  'Block': ['##', '##'],
  'Blinker': ['###'],
  'Glider': ['.#.', '..#', '###'],
  'Toad': ['.###', '###.'],
  'Beacon': ['##..', '##..', '..##', '..##'],
  'Beehive': ['.##.', '#..#', '.##.'],
  'Loaf': ['.##.', '#..#', '.#.#', '..#.'],
  'Boat': ['##.', '#.#', '.#.'],
  'Bakery': [
    '....##....',
    '...#..#...',
    '....#.#...',
    '.#...#.##.',
    '#.#...#..#',
    '#..#...#.#',
    '.#.#....#.',
    '...#.#....',
    '...#..#...',
    '....##....'
  ],
  'Lightweight Spaceship': ['.#..#', '#....', '#...#', '####.'],
  'Heavyweight Spaceship': ['...##..', '.#....#', '#......', '#.....#', '######.'],
  'Pulsar': [
    '..###...###..',
    '.............',
    '#....#.#....#',
    '#....#.#....#',
    '#....#.#....#',
    '..###...###..',
    '.............',
    '..###...###..',
    '#....#.#....#',
    '#....#.#....#',
    '#....#.#....#',
    '.............',
    '..###...###..'
  ],
  'Gosper Glider Gun': [
    '........................#...........',
    '......................#.#...........',
    '............##......##............##',
    '...........#...#....##............##',
    '##........#.....#...##..............',
    '##........#...#.##....#.#...........',
    '..........#.....#.......#...........',
    '...........#...#....................',
    '............##......................'
  ]
};

function validateRows(name, rows) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${name}: rows must be a non-empty array`);
  const width = rows[0].length;
  if (width < 1) throw new Error(`${name}: rows must not be empty`);
  for (const row of rows) {
    if (typeof row !== 'string' || row.length !== width || /[^.#]/.test(row)) throw new Error(`${name}: invalid pattern rows`);
  }
}

function rowsToPoints(name, rows) {
  validateRows(name, rows);
  const points = [];
  rows.forEach((row, y) => [...row].forEach((cell, x) => { if (cell === '#') points.push([x, y]); }));
  return { name, width: rows[0].length, height: rows.length, points };
}

export const TOOLBOX_PATTERNS = Object.entries(RAW_PATTERNS).map(([name, rows]) => rowsToPoints(name, rows));

export function getToolboxPattern(name) {
  const pattern = TOOLBOX_PATTERNS.find(item => item.name === name);
  if (!pattern) throw new Error(`Unknown toolbox pattern: ${name}`);
  return pattern;
}

export function placePattern(grid, cols, rows, pattern, originX, originY) {
  if (!(grid instanceof Uint8Array)) throw new TypeError('grid must be a Uint8Array');
  if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1 || grid.length !== cols * rows) throw new Error('grid dimensions are invalid');
  if (!pattern || !Array.isArray(pattern.points)) throw new TypeError('pattern is invalid');
  if (!Number.isInteger(originX) || !Number.isInteger(originY)) throw new TypeError('origin must use integer coordinates');
  let placed = 0;
  for (const [dx, dy] of pattern.points) {
    const x = originX + dx, y = originY + dy;
    if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
    const index = y * cols + x;
    if (!grid[index]) placed++;
    grid[index] = 1;
  }
  return placed;
}
