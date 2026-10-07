// Shared by the application and static comparison. Mobile keyboards can resize
// the visual viewport without changing the layout viewport or 100dvh.
export function installPaneViewport() {
  const root = document.documentElement
  const viewport = window.visualViewport
  const update = () => {
    const height = viewport?.height ?? window.innerHeight
    const top = viewport?.offsetTop ?? 0
    root.style.setProperty('--pane-vh', `${height}px`)
    root.style.setProperty('--pane-vtop', `${top}px`)
    root.style.setProperty('--pane-vbottom', `${Math.max(0, window.innerHeight - height - top)}px`)
  }
  update()
  window.addEventListener('resize', update)
  viewport?.addEventListener('resize', update)
  viewport?.addEventListener('scroll', update)
  return () => {
    window.removeEventListener('resize', update)
    viewport?.removeEventListener('resize', update)
    viewport?.removeEventListener('scroll', update)
    for (const name of ['--pane-vh', '--pane-vtop', '--pane-vbottom']) root.style.removeProperty(name)
  }
}
