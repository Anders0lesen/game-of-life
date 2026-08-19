const BAKERY_ROWS = [
  '....##....',
  '...#..#...',
  '...#.#....',
  '.##.#...#.',
  '#..#...#.#',
  '#.#...#..#',
  '.#...#.##.',
  '....#.#...',
  '...#..#...',
  '....##....'
];

const RAW_PATTERNS = {
  'Block': ['##', '##'],
  'Blinker': ['###'],
  'Glider': ['.#.', '..#', '###'],
  'Toad': ['.###', '###.'],
  'Beacon': ['##..', '##..', '..##', '..##'],
  'Beehive': ['.##.', '#..#', '.##.'],
  'Loaf': ['.##.', '#..#', '.#.#', '..#.'],
  'Boat': ['##.', '#.#', '.#.'],
  // Canonical 28-cell Bakery from LifeWiki: two half-bakeries / bi-loaf formation.
  'Bakery': BAKERY_ROWS,
  // Two complete canonical bakeries separated by four dead columns.
  'Double Bakery': BAKERY_ROWS.map(row => `${row}....${row}`),
  'Lightweight Spaceship': ['.#..#', '#....', '#...#', '####.'],
  'Middleweight Spaceship': ['...#..', '.#...#', '#.....', '#....#', '#####.'],
  'Heavyweight Spaceship': ['...##..', '.#....#', '#......', '#.....#', '######.'],
  'Canada Goose': ['###..........','.#...........','...#.........','..##.........','.............','.....###.....','.....#.......','.......#.....','......##.....','.............','..........##.','.........#..#','..........##.'],
  'Pulsar': ['..###...###..','.............','#....#.#....#','#....#.#....#','#....#.#....#','..###...###..','.............','..###...###..','#....#.#....#','#....#.#....#','#....#.#....#','.............','..###...###..'],
  'Gosper Glider Gun': ['........................#...........','......................#.#...........','............##......##............##','...........#...#....##............##','##........#.....#...##..............','##........#...#.##....#.#...........','..........#.....#.......#...........','...........#...#....................','............##......................']
};
function validateRows(name,rows){if(!Array.isArray(rows)||rows.length===0)throw new Error(`${name}: rows must be a non-empty array`);const width=rows[0].length;if(width<1)throw new Error(`${name}: rows must not be empty`);for(const row of rows)if(typeof row!=='string'||row.length!==width||/[^.#]/.test(row))throw new Error(`${name}: invalid pattern rows`)}
function rowsToPoints(name,rows){validateRows(name,rows);const points=[];rows.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='#')points.push([x,y])}));return{name,width:rows[0].length,height:rows.length,points}}
export const TOOLBOX_PATTERNS=Object.entries(RAW_PATTERNS).map(([name,rows])=>rowsToPoints(name,rows));
export function getToolboxPattern(name){const pattern=TOOLBOX_PATTERNS.find(item=>item.name===name);if(!pattern)throw new Error(`Unknown toolbox pattern: ${name}`);return pattern}
export function rotatePattern(pattern,quarterTurns=1){if(!pattern||!Array.isArray(pattern.points))throw new TypeError('pattern is invalid');if(!Number.isInteger(quarterTurns))throw new TypeError('quarterTurns must be an integer');let turns=((quarterTurns%4)+4)%4,current={name:pattern.name,width:pattern.width,height:pattern.height,points:pattern.points.map(([x,y])=>[x,y])};while(turns-->0){const nextPoints=current.points.map(([x,y])=>[current.height-1-y,x]);current={name:current.name,width:current.height,height:current.width,points:nextPoints}}return current}
export function placePattern(grid,cols,rows,pattern,originX,originY){if(!(grid instanceof Uint8Array))throw new TypeError('grid must be a Uint8Array');if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||rows<1||grid.length!==cols*rows)throw new Error('grid dimensions are invalid');if(!pattern||!Array.isArray(pattern.points))throw new TypeError('pattern is invalid');if(!Number.isInteger(originX)||!Number.isInteger(originY))throw new Error('origin must use integer coordinates');let placed=0;for(const[dx,dy]of pattern.points){const x=originX+dx,y=originY+dy;if(x<0||x>=cols||y<0||y>=rows)continue;const index=y*cols+x;if(!grid[index])placed++;grid[index]=1}return placed}
function rotatePatternInPlace(pattern){const rotated=rotatePattern(pattern,1);pattern.width=rotated.width;pattern.height=rotated.height;pattern.points=rotated.points}
function installRadialInteractions(){if(typeof document==='undefined'||typeof PointerEvent==='undefined')return;let down=null,dragging=false,programmaticSelect=false,suppressClick=false;const preview=document.createElement('div');preview.setAttribute('aria-hidden','true');Object.assign(preview.style,{position:'fixed',display:'none',pointerEvents:'none',zIndex:'100',opacity:'.72'});document.body.append(preview);const previewPattern=(pattern,clientX,clientY)=>{const canvas=document.querySelector('#life'),sizeInput=document.querySelector('#cellSize');if(!canvas||!sizeInput)return false;const rect=canvas.getBoundingClientRect(),cell=Math.max(1,Number(sizeInput.value)||14),inside=clientX>=rect.left&&clientX<rect.right&&clientY>=rect.top&&clientY<rect.bottom,x=Math.floor((clientX-rect.left)/cell),y=Math.floor((clientY-rect.top)/cell),originX=x-Math.floor(pattern.width/2),originY=y-Math.floor(pattern.height/2),width=pattern.width*cell,height=pattern.height*cell;Object.assign(preview.style,{left:`${inside?rect.left+originX*cell:clientX-width/2}px`,top:`${inside?rect.top+originY*cell:clientY-height/2}px`,width:`${width}px`,height:`${height}px`,display:'block',border:inside?'1px solid rgba(103,232,249,.8)':'1px solid rgba(239,68,68,.7)',background:'rgba(5,7,10,.55)'});const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${pattern.width} ${pattern.height}`);svg.setAttribute('width','100%');svg.setAttribute('height','100%');for(const[px,py]of pattern.points){const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',px+.08);r.setAttribute('y',py+.08);r.setAttribute('width','.84');r.setAttribute('height','.84');r.setAttribute('fill',inside?'#67e8f9':'#ef4444');svg.append(r)}preview.replaceChildren(svg);return inside};document.addEventListener('pointerdown',e=>{const button=e.target.closest?.('.radial-item[data-tool]');if(!button||button.dataset.tool==='Draw')return;down={button,name:button.dataset.tool,x:e.clientX,y:e.clientY,pointerId:e.pointerId};dragging=false},true);document.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.pointerId)return;if(!dragging&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<9)return;dragging=true;previewPattern(getToolboxPattern(down.name),e.clientX,e.clientY);e.preventDefault()},{capture:true,passive:false});document.addEventListener('pointerup',e=>{if(!down||e.pointerId!==down.pointerId)return;const finished=down;down=null;preview.style.display='none';if(!dragging)return;dragging=false;suppressClick=true;const canvas=document.querySelector('#life');if(!canvas)return;const rect=canvas.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>=rect.right||e.clientY<rect.top||e.clientY>=rect.bottom)return;programmaticSelect=true;finished.button.click();programmaticSelect=false;canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY,pointerId:999,pointerType:e.pointerType||'touch'}))},true);document.addEventListener('pointercancel',()=>{down=null;dragging=false;preview.style.display='none'},true);document.addEventListener('click',e=>{const button=e.target.closest?.('.radial-item[data-tool]');if(!button||button.dataset.tool==='Draw')return;if(suppressClick&&!programmaticSelect){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();return}if(programmaticSelect)return;if(button.classList.contains('selected')){const pattern=getToolboxPattern(button.dataset.tool);rotatePatternInPlace(pattern);console.log('[GameOfLife]','pattern rotated',{name:pattern.name,width:pattern.width,height:pattern.height})}},true);const sizeInput=document.querySelector('#cellSize');if(sizeInput)sizeInput.min='4'}
if(typeof window!=='undefined')queueMicrotask(installRadialInteractions);
