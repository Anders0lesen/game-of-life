import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGeneration } from '../life.mjs';
import { knownPatternNames, recognizePatterns } from '../patterns.mjs';

function makeGrid(rows, padding = 2) {
  const width = rows[0].length + padding * 2;
  const height = rows.length + padding * 2;
  const data = new Uint8Array(width * height);
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === '#') data[(y + padding) * width + x + padding] = 1;
  }));
  return { data, width, height };
}

function names(result) {
  return Object.fromEntries(result.map(({ name, count }) => [name, count]));
}

test('recognizer exposes expected first pattern set', () => {
  assert.deepEqual(knownPatternNames(), ['Block', 'Blinker', 'Glider', 'Toad', 'Beacon', 'Beehive', 'Loaf', 'Boat']);
});

test('recognizes a block', () => {
  const g = makeGrid(['##', '##']);
  assert.deepEqual(names(recognizePatterns(g.data, g.width, g.height)), { Block: 1 });
});

test('recognizes horizontal and vertical blinkers', () => {
  const horizontal = makeGrid(['###']);
  const vertical = makeGrid(['#', '#', '#']);
  assert.equal(names(recognizePatterns(horizontal.data, horizontal.width, horizontal.height)).Blinker, 1);
  assert.equal(names(recognizePatterns(vertical.data, vertical.width, vertical.height)).Blinker, 1);
});

test('recognizes every phase of a glider', () => {
  let g = makeGrid(['.#.', '..#', '###'], 5);
  for (let phase = 0; phase < 4; phase++) {
    assert.equal(names(recognizePatterns(g.data, g.width, g.height)).Glider, 1, `phase ${phase}`);
    g = { ...g, data: nextGeneration(g.data, g.width, g.height) };
  }
});

test('recognizes common oscillator and still-life patterns', () => {
  const examples = [
    ['Toad', ['.###', '###.']],
    ['Beacon', ['##..', '##..', '..##', '..##']],
    ['Beehive', ['.##.', '#..#', '.##.']],
    ['Loaf', ['.##.', '#..#', '.#.#', '..#.']],
    ['Boat', ['##.', '#.#', '.#.']]
  ];
  for (const [expected, rows] of examples) {
    const g = makeGrid(rows);
    assert.equal(names(recognizePatterns(g.data, g.width, g.height))[expected], 1, expected);
  }
});

test('counts separate known components', () => {
  const width = 12, height = 6;
  const data = new Uint8Array(width * height);
  const set = (x, y) => { data[y * width + x] = 1; };
  set(1, 1); set(2, 1); set(1, 2); set(2, 2);
  set(7, 2); set(8, 2); set(9, 2);
  assert.deepEqual(names(recognizePatterns(data, width, height)), { Blinker: 1, Block: 1 });
});

test('does not report a known pattern embedded in a larger connected blob', () => {
  const g = makeGrid(['###', '.#.']);
  assert.deepEqual(recognizePatterns(g.data, g.width, g.height), []);
});

test('rejects malformed grid loudly', () => {
  assert.throws(() => recognizePatterns(new Uint8Array(3), 2, 2), /does not match/);
});
