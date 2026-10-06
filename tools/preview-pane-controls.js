// The static export has no React event handlers. Restore only presentation
// controls; commerce mutations remain disabled by the preview's form policy.
import { installPaneSwipe } from './pane-swipe.js'
installPaneSwipe()

document.addEventListener('click', async event => {
  const trigger = event.target instanceof Element ? event.target.closest('button, a') : null
  if (!trigger || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const dialog = trigger.nextElementSibling
  if (trigger.matches('button[aria-haspopup="dialog"]') && dialog instanceof HTMLDialogElement) {
    dialog.showModal()
    return
  }
  if (trigger.matches('dialog [class*="__close"]')) {
    trigger.closest('dialog').close()
    return
  }
  if (!trigger.matches('a[aria-haspopup="dialog"][href$="/cart"]')) return
  const pane = trigger.parentElement.querySelector('[data-pane="end"]')
  if (!pane) return
  event.preventDefault()
  pane.showPopover()
  const body = pane.querySelector('[aria-busy="true"]')
  if (!body) return
  // Reuse the exported cart's actual empty state rather than inventing order data.
  try {
    const response = await fetch(trigger.href)
    if (!response.ok) throw new Error('Cart preview unavailable')
    const page = new DOMParser().parseFromString(await response.text(), 'text/html')
    const state = page.querySelector('main [data-kind="empty"]')
    if (!state) throw new Error('No exported cart state')
    const heading = state.querySelector('h1')
    if (heading) {
      const h2 = document.createElement('h2'); h2.textContent = heading.textContent; heading.replaceWith(h2)
    }
    body.replaceChildren(document.importNode(state, true))
    body.removeAttribute('aria-busy')
  } catch {
    const link = trigger.cloneNode(true)
    link.removeAttribute('aria-haspopup'); link.removeAttribute('class')
    link.textContent = trigger.getAttribute('aria-label')
    body.replaceChildren(link); body.removeAttribute('aria-busy')
  }
})
