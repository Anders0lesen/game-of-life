(() => {
  'use strict';

  const STORAGE_KEY = 'jonas-life-colors';
  const VERSION = 'v0.5.0';
  const originalFillStyle = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');

  if (!originalFillStyle?.get || !originalFillStyle?.set) {
    console.error('[GameOfLife] Unable to wrap canvas fillStyle; color toggle disabled');
    return;
  }

  function colorsEnabled() { return localStorage.getItem(STORAGE_KEY) !== 'off'; }

  Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillStyle', {
    configurable: true, enumerable: originalFillStyle.enumerable,
    get() { return originalFillStyle.get.call(this); },
    set(value) {
      if (!colorsEnabled()) {
        if (value === '#22c55e' || value === '#ef4444') value = '#67e8f9';
        else if (value === 'rgba(103,232,249,.42)') value = 'rgba(103,232,249,0)';
      }
      originalFillStyle.set.call(this, value);
    }
  });

  function requestRedraw() {
    const input = document.querySelector('#birth');
    if (input) input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function injectCss() {
    const style = document.createElement('style');
    style.textContent = `
      .settings{position:static!important;right:auto!important;top:auto!important;z-index:auto!important}
      .settings>summary{display:none!important}
      .settings-panel{position:fixed!important;left:10px!important;right:10px!important;top:auto!important;bottom:76px!important;width:auto!important;max-height:70dvh;overflow:auto;z-index:90}
      .top{height:82px!important;grid-template-columns:minmax(0,1fr) minmax(160px,45%)!important}
      .status-stack{height:82px!important;grid-template-rows:24px 20px 34px!important}
      .pattern-badges{display:none!important}
      .known-patterns{height:74px;min-height:74px;display:flex;align-items:center;gap:5px;width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:5px 1px}
      .known-patterns::-webkit-scrollbar{display:none}
      .known-pattern{position:relative;flex:1 0 42px;min-width:42px;max-width:58px;height:58px;border:1px solid var(--line);border-radius:9px;background:var(--panel);display:grid;place-items:center;opacity:.38;overflow:visible}
      .known-pattern.missing::after{content:'';position:absolute;left:5px;right:5px;top:50%;height:2px;background:#8791a1;transform:rotate(-35deg);box-shadow:0 0 0 1px #090b10}
      .known-pattern.present{opacity:1;border-color:#405068}
      .known-pattern .pattern-icon{width:32px!important;height:32px!important}
      .known-pattern .count{position:absolute;right:-4px;top:-5px;z-index:2;min-width:18px;height:18px;padding:0 4px;border-radius:10px;background:var(--accent);color:#fff;font-size:10px;font-weight:800;display:grid;place-items:center}
      .controls{height:62px;min-height:62px}
      .main-actions{display:grid!important;grid-template-columns:repeat(6,1fr);gap:7px!important;width:100%}
      .main-actions button,.bottom-icon{min-width:0!important;width:100%;height:56px;min-height:56px!important;padding:0!important;display:grid;place-items:center;border-radius:12px;font-size:0!important}
      .main-actions button::before,.bottom-icon::before{font-size:25px;line-height:1}
      #play::before{content:'▶'} #play.running-icon::before{content:'⏸'} #step::before{content:'›';font-size:40px} #random::before{content:'⚄'} #clear::before{content:'⌫'}
      .bottom-icon.settings-button::before{content:'⚙'} .bottom-icon.pattern-button::before{content:'▦'}
      .radial-launcher{display:none!important}
      @media(max-width:600px){main{padding-top:10px!important}.board{height:58dvh!important}.known-patterns{height:68px;min-height:68px}.known-pattern{height:52px}.controls{height:58px;min-height:58px}.main-actions button,.bottom-icon{height:52px;min-height:52px!important}}
    `;
    document.head.append(style);
  }

  function installSettings() {
    const panel = document.querySelector('.settings-panel');
    if (!panel) { console.error('[GameOfLife] Settings panel not found; color selector not installed'); return; }
    if (!document.querySelector('#colorMode')) {
      const row = document.createElement('div'); row.className='row';
      const label=document.createElement('label'); label.textContent='Colors ';
      const select=document.createElement('select'); select.id='colorMode'; select.setAttribute('aria-label','Cell colors');
      select.innerHTML='<option value="on">On — show next-generation fate</option><option value="off">Off — classic single color</option>';
      select.value=colorsEnabled()?'on':'off';
      select.addEventListener('change',()=>{localStorage.setItem(STORAGE_KEY,select.value);console.log('[GameOfLife] color mode changed',{enabled:select.value==='on'});requestRedraw();});
      label.append(select);row.append(label);panel.append(row);
    }
    const version=document.querySelector('.version');if(version)version.textContent=VERSION;
  }

  function makeIcon(pattern) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('pattern-icon');svg.setAttribute('viewBox',`-.6 -.6 ${pattern.width+1.2} ${pattern.height+1.2}`);
    for(const[x,y]of pattern.points){const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',x+.08);r.setAttribute('y',y+.08);r.setAttribute('width','.84');r.setAttribute('height','.84');svg.append(r)}return svg;
  }

  async function installStablePatterns() {
    const old=document.querySelector('#patterns'); if(!old)return;
    try {
      const [{TOOLBOX_PATTERNS},{recognizePatterns}] = await Promise.all([import('./toolbox.mjs'),import('./patterns.mjs')]);
      const strip=document.createElement('div');strip.className='known-patterns';strip.setAttribute('aria-label','Known patterns');old.insertAdjacentElement('afterend',strip);
      const items=new Map();
      for(const p of TOOLBOX_PATTERNS){const el=document.createElement('div');el.className='known-pattern missing';el.title=p.name;el.append(makeIcon(p));strip.append(el);items.set(p.name,el)}
      const canvas=document.querySelector('#life');
      const refresh=()=>{
        const cols=Math.max(1,Math.floor(canvas.clientWidth/(+document.querySelector('#cellSize').value||14))),rows=Math.max(1,Math.floor(canvas.clientHeight/(+document.querySelector('#cellSize').value||14)));
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        // Recognition remains owned by the game engine; mirror its rendered badges rather than guessing grid state from pixels.
        const counts=new Map();
        for(const badge of old.querySelectorAll('.pattern-badge')){const title=badge.title||'';const m=title.match(/^(\d+) × (.+)$/);if(m)counts.set(m[2],+m[1]);else if(title)counts.set(title,1)}
        for(const[name,el]of items){const count=counts.get(name)||0;el.classList.toggle('present',count>0);el.classList.toggle('missing',count===0);el.querySelector('.count')?.remove();if(count){const b=document.createElement('span');b.className='count';b.textContent=count;el.append(b)}}
      };
      new MutationObserver(refresh).observe(old,{childList:true,subtree:true,attributes:true});refresh();
    } catch(err){console.error('[GameOfLife] Unable to install stable known-pattern strip',err)}
  }

  function installBottomToolbar() {
    const row=document.querySelector('.main-actions');const details=document.querySelector('.settings');const launcher=document.querySelector('#radialLauncher');if(!row||!details||!launcher){console.error('[GameOfLife] Bottom toolbar prerequisites missing');return}
    const settings=document.createElement('button');settings.type='button';settings.className='bottom-icon settings-button';settings.title='Settings';settings.setAttribute('aria-label','Settings');settings.onclick=()=>{details.open=!details.open};row.append(settings);
    const patterns=document.createElement('button');patterns.type='button';patterns.className='bottom-icon pattern-button';patterns.title='Patterns';patterns.setAttribute('aria-label','Patterns');patterns.onclick=()=>launcher.click();row.append(patterns);
    const play=document.querySelector('#play');new MutationObserver(()=>play.classList.toggle('running-icon',play.textContent.includes('Pause'))).observe(play,{childList:true,subtree:true});
  }

  function install(){injectCss();installSettings();installBottomToolbar();installStablePatterns()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
