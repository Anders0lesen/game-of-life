(() => {
  'use strict';

  const STORAGE_KEY = 'jonas-life-colors';
  const VERSION = 'v0.4.2';
  const originalFillStyle = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle');

  if (!originalFillStyle?.get || !originalFillStyle?.set) {
    console.error('[GameOfLife] Unable to wrap canvas fillStyle; color toggle disabled');
    return;
  }

  function colorsEnabled() {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  }

  Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillStyle', {
    configurable: true,
    enumerable: originalFillStyle.enumerable,
    get() {
      return originalFillStyle.get.call(this);
    },
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

  function installSettings() {
    const panel = document.querySelector('.settings-panel');
    if (!panel) {
      console.error('[GameOfLife] Settings panel not found; color selector not installed');
      return;
    }

    if (!document.querySelector('#colorMode')) {
      const row = document.createElement('div');
      row.className = 'row';
      const label = document.createElement('label');
      label.textContent = 'Colors ';
      const select = document.createElement('select');
      select.id = 'colorMode';
      select.setAttribute('aria-label', 'Cell colors');
      select.innerHTML = '<option value="on">On — show next-generation fate</option><option value="off">Off — classic single color</option>';
      select.value = colorsEnabled() ? 'on' : 'off';
      select.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEY, select.value);
        console.log('[GameOfLife] color mode changed', { enabled: select.value === 'on' });
        requestRedraw();
      });
      label.append(select);
      row.append(label);
      panel.append(row);
    }

    const version = document.querySelector('.version');
    if (version) version.textContent = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSettings, { once: true });
  else installSettings();
})();
