// Shared visual feedback; never delays or synthesizes an action.
/* Нажатый вид держится не меньше `--press-hold-t` ОТ НАЧАЛА касания, а не после
   того, как палец поднят (И782). Прежде к касанию в 76 мс прибавлялось ещё
   180 мс после отпускания: «нажатие задерживается на кнопке» (заказчик
   08.10.2026, «Add to cart» на телефоне); на мыши то же самое. Короткое касание
   по-прежнему видно, долгое не удлиняется. */
export function installPressFeedback(pressClass) {
  const active = new Map();
  const began = new Map();
  const selector = '.' + pressClass.split(' ')[0];
  const clear = el => { clearTimeout(active.get(el)); active.delete(el); began.delete(el); el.removeAttribute('data-press-feedback'); };
  const find = event => {
    const el = event.target instanceof Element ? event.target.closest(selector) : null;
    return el && !el.matches(':disabled,[aria-disabled="true"],[data-hand="menu"],[data-voice="bare"]') ? el : null;
  };
  const show = el => { clearTimeout(active.get(el)); if (!began.has(el)) began.set(el, performance.now()); el.setAttribute('data-press-feedback',''); active.set(el,null); };
  const release = el => {
    const raw = getComputedStyle(el).getPropertyValue('--press-hold-t').trim();
    const min = parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000);
    const left = Math.max(0, (Number.isFinite(min) ? min : 120) - (performance.now() - (began.get(el) ?? 0)));
    active.set(el,setTimeout(() => clear(el), left));
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
