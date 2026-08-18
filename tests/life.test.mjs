import test from 'node:test';
import assert from 'node:assert/strict';
import { findRepeatPeriod, gridsEqual, nextGeneration, parseRule, population } from '../life.mjs';

const grid = (rows) => {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8Array(width * height);
  rows.forEach((row, y) => [...row].forEach((c, x) => { data[y * width + x] = c === '#' ? 1 : 0; }));
  return { data, width, height };
};

const render = (data, width, height) => Array.from({ length: height }, (_, y) =>
  Array.from({ length: width }, (_, x) => data[y * width + x] ? '#' : '.').join('')
);

test('Conway block remains stable', () => {
  const g = grid(['....', '.##.', '.##.', '....']);
  const next = nextGeneration(g.data, g.width, g.height);
  assert.deepEqual(render(next, g.width, g.height), ['....', '.##.', '.##.', '....']);
});

test('Conway blinker oscillates', () => {
  const g = grid(['.....', '.....', '.###.', '.....', '.....']);
  const next = nextGeneration(g.data, g.width, g.height);
  assert.deepEqual(render(next, g.width, g.height), ['.....', '..#..', '..#..', '..#..', '.....']);
  const again = nextGeneration(next, g.width, g.height);
  assert.deepEqual(render(again, g.width, g.height), ['.....', '.....', '.###.', '.....', '.....']);
});

test('live cell dies from underpopulation', () => {
  const g = grid(['...', '.#.', '...']);
  assert.equal(population(nextGeneration(g.data, 3, 3)), 0);
});

test('live cell dies from overpopulation', () => {
  const g = grid(['###', '###', '...']);
  const next = nextGeneration(g.data, 3, 3);
  assert.equal(next[1 * 3 + 1], 0);
});

test('dead cell with three neighbours is born', () => {
  const g = grid(['.#.', '#.#', '...']);
  const next = nextGeneration(g.data, 3, 3);
  assert.equal(next[1 * 3 + 1], 1);
});

test('edges do not wrap around', () => {
  const g = grid(['#.#', '...', '#..']);
  const next = nextGeneration(g.data, 3, 3);
  assert.equal(next[2 * 3 + 2], 0);
});

test('alternative rules are honoured', () => {
  const g = grid(['.#.', '#..', '...']);
  const next = nextGeneration(g.data, 3, 3, '2', '');
  assert.equal(next[1 * 3 + 1], 1);
});

test('invalid rule text is rejected loudly', () => {
  assert.throws(() => parseRule('3x'), /Invalid rule/);
});

test('invalid grid dimensions are rejected loudly', () => {
  assert.throws(() => nextGeneration(new Uint8Array(3), 2, 2), /does not match/);
});

test('grid equality detects identical and different states', () => {
  assert.equal(gridsEqual(new Uint8Array([1, 0, 1]), new Uint8Array([1, 0, 1])), true);
  assert.equal(gridsEqual(new Uint8Array([1, 0, 1]), new Uint8Array([1, 1, 1])), false);
  assert.equal(gridsEqual(new Uint8Array([1]), new Uint8Array([1, 0])), false);
});

test('repeat detection finds a stable period-1 state', () => {
  const state = new Uint8Array([0, 1, 1, 0]);
  assert.equal(findRepeatPeriod(state, [state.slice()], 3), 1);
});

test('repeat detection finds a period-2 oscillator', () => {
  const a = new Uint8Array([1, 0, 1]);
  const b = new Uint8Array([0, 1, 0]);
  assert.equal(findRepeatPeriod(a, [a.slice(), b.slice()], 3), 2);
});

test('repeat detection ignores states older than the configured lookback', () => {
  const a = new Uint8Array([1, 0]);
  const b = new Uint8Array([0, 1]);
  const c = new Uint8Array([1, 1]);
  const d = new Uint8Array([0, 0]);
  assert.equal(findRepeatPeriod(a, [a.slice(), b, c, d], 3), 0);
});
