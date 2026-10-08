// Shared visual feedback; never delays or synthesizes an action.
export function installPressFeedback(pressClass) {
  const active = new Map();
  const selector = '.' + pressClass.split(' ')[0];
  const clear = el => { clearTimeout(active.get(el)); active.delete(el); el.removeAttribute('data-press-feedback'); };
  const find = event => {
    const el = event.target instanceof Element ? event.target.closest(selector) : null;
    return el && !el.matches(':disabled,[aria-disabled="true"],[data-hand="menu"],[data-voice="bare"]') ? el : null;
  };
  const show = el => { clearTimeout(active.get(el)); el.setAttribute('data-press-feedback',''); active.set(el,null); };
  const release = el => {
    const raw = getComputedStyle(el).getPropertyValue('--press-hold-t').trim();
    const ms = parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000);
    active.set(el,setTimeout(() => clear(el), Number.isFinite(ms) ? ms : 180));
  };
  const down = e => { if (e.button !== 0) return; const el=find(e); if(el) show(el); };
  const up = () => { for(const el of active.keys()) release(el); };
  const cancel = () => { for(const el of [...active.keys()]) clear(el); };
  const click = e => { const el=find(e); if(el) { show(el); release(el); } };
  document.addEventListener('pointerdown',down,true);
  document.addEventListener('pointerup',up,true);
  document.addEventListener('pointercancel',cancel,true);
  document.addEventListener('click',click,true);
  window.addEventListener('blur',cancel);
  return () => { cancel(); document.removeEventListener('pointerdown',down,true); document.removeEventListener('pointerup',up,true); document.removeEventListener('pointercancel',cancel,true); document.removeEventListener('click',click,true); window.removeEventListener('blur',cancel); };
}
