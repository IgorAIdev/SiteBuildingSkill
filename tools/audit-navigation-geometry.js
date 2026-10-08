/* Read-only browser assertion: run at desktop and mobile widths after scroll. */
(() => {
  const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
  const failures = [];
  for (const button of document.querySelectorAll('button')) {
    if (!visible(button) || !button.className.match(/(?:_|__)(?:knob|top)(?:_|\b)/)) continue;
    const b = button.getBoundingClientRect();
    for (const icon of [...button.querySelectorAll(':scope > svg')].filter(visible)) {
      const r = icon.getBoundingClientRect();
      if (Math.abs(r.x + r.width / 2 - b.x - b.width / 2) > 1 || Math.abs(r.y + r.height / 2 - b.y - b.height / 2) > 1) failures.push(button.getAttribute('aria-label') + ': icon off centre');
    }
  }
  for (const item of document.querySelectorAll('li[data-params]')) {
    if (!visible(item)) continue;
    if ([...item.querySelectorAll(':scope > button')].filter(visible).length !== 1) failures.push('Disclosure must have exactly one visible trigger');
  }
  for (const badge of document.querySelectorAll('header span[class*="_badge_"]')) {
    if (!visible(badge)) continue;
    const r = badge.getBoundingClientRect();
    const icon = [...badge.parentElement.querySelectorAll('svg')].find(visible);
    if (!icon) continue;
    const i = icon.getBoundingClientRect();
    if (Math.abs(r.bottom - i.top - r.height * .25) > 1) failures.push('Counter must overlap the icon by one quarter of its height');
    if (r.left < 0 || r.right > innerWidth) failures.push('Counter clipped by viewport');
  }
  if (failures.length) throw new Error(failures.join('; '));
  return { passed: true };
})()

