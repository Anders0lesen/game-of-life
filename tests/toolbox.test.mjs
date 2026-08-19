import test from 'node:test';
import assert from 'node:assert/strict';
import { TOOLBOX_PATTERNS, getToolboxPattern, placePattern, rotatePattern } from '../toolbox.mjs';

const names = TOOLBOX_PATTERNS.map(pattern => pattern.name);

test('toolbox exposes expected patterns', () => {
  assert.deepEqual(names, ['Block','Blinker','Glider','Toad','Beacon','Beehive','Loaf','Boat','Bakery','Lightweight Spaceship','Heavyweight Spaceship','Pulsar','Gosper Glider Gun']);
});

test('every toolbox pattern has valid dimensions and live cells', () => {
  for (const pattern of TOOLBOX_PATTERNS) {
    assert.ok(pattern.width > 0, pattern.name);
    assert.ok(pattern.height > 0, pattern.name);
    assert.ok(pattern.points.length > 0, pattern.name);
    for (const [x, y] of pattern.points) {
      assert.ok(x >= 0 && x < pattern.width, `${pattern.name} x`);
      assert.ok(y >= 0 && y < pattern.height, `${pattern.name} y`);
    }
  }
});

test('known advanced patterns have expected populations', () => {
  assert.equal(getToolboxPattern('Bakery').points.length, 27);
  assert.equal(getToolboxPattern('Lightweight Spaceship').points.length, 9);
  assert.equal(getToolboxPattern('Heavyweight Spaceship').points.length, 13);
});

test('rotating a glider 90 degrees preserves population and swaps dimensions', () => {
  const original = getToolboxPattern('Glider');
  const rotated = rotatePattern(original, 1);
  assert.equal(rotated.points.length, original.points.length);
  assert.equal(rotated.width, original.height);
  assert.equal(rotated.height, original.width);
  assert.deepEqual(rotated.points.sort(), [[0,0],[0,1],[0,2],[1,2],[2,1]].sort());
});

test('four quarter turns return a pattern to its original geometry', () => {
  const original = getToolboxPattern('Heavyweight Spaceship');
  const rotated = rotatePattern(original, 4);
  assert.equal(rotated.width, original.width);
  assert.equal(rotated.height, original.height);
  assert.deepEqual(rotated.points.sort(), original.points.map(p => [...p]).sort());
});

test('negative quarter turns are supported', () => {
  const original = getToolboxPattern('Blinker');
  const rotated = rotatePattern(original, -1);
  assert.equal(rotated.width, 1);
  assert.equal(rotated.height, 3);
});

test('placing a glider writes exactly five live cells', () => {
  const grid = new Uint8Array(10 * 10);
  const placed = placePattern(grid, 10, 10, getToolboxPattern('Glider'), 2, 3);
  assert.equal(placed, 5);
  assert.equal(grid.reduce((a, b) => a + b, 0), 5);
});

test('placement clips safely at board edge', () => {
  const grid = new Uint8Array(4 * 4);
  const placed = placePattern(grid, 4, 4, getToolboxPattern('Block'), 3, 3);
  assert.equal(placed, 1);
  assert.equal(grid[15], 1);
});

test('placing over existing live cells does not inflate placed count', () => {
  const grid = new Uint8Array(6 * 6), block = getToolboxPattern('Block');
  assert.equal(placePattern(grid, 6, 6, block, 1, 1), 4);
  assert.equal(placePattern(grid, 6, 6, block, 1, 1), 0);
});

test('unknown pattern fails loudly', () => assert.throws(() => getToolboxPattern('Definitely Not Real'), /Unknown toolbox pattern/));
test('invalid grid dimensions fail loudly', () => assert.throws(() => placePattern(new Uint8Array(3), 2, 2, getToolboxPattern('Block'), 0, 0), /invalid/));
