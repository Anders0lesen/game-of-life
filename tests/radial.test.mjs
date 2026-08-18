import test from 'node:test';
import assert from 'node:assert/strict';
import { radialLayout } from '../radial.mjs';

const inside = (positions, ax, ay, w, h) => positions.every(({x,y}) => ax+x>=26 && ax+x<=w-26 && ay+y>=26 && ay+y<=h-26);

test('radial layout returns one position per item', () => {
  assert.equal(radialLayout(11, 350, 700, 390, 780).length, 11);
});

test('bottom-right launcher fans generally up-left', () => {
  const p = radialLayout(6, 360, 740, 390, 780);
  assert.ok(p.reduce((s,v)=>s+v.x,0) < 0);
  assert.ok(p.reduce((s,v)=>s+v.y,0) < 0);
});

test('top-left launcher fans generally down-right', () => {
  const p = radialLayout(6, 30, 30, 390, 780);
  assert.ok(p.reduce((s,v)=>s+v.x,0) > 0);
  assert.ok(p.reduce((s,v)=>s+v.y,0) > 0);
});

test('all touch targets stay inside viewport margins', () => {
  for (const [ax,ay,w,h] of [[360,740,390,780],[20,20,390,780],[195,390,390,780],[800,400,820,900]]) {
    const p = radialLayout(11,ax,ay,w,h);
    assert.ok(inside(p,ax,ay,w,h));
  }
});

test('rejects invalid input loudly', () => {
  assert.throws(()=>radialLayout(0,0,0,390,780),/itemCount/);
  assert.throws(()=>radialLayout(2,0,0,-1,780),/positive/);
});
