import pn from '@/styles/pane.module.css'

// Shared gesture target. Direction and dismissal belong to pane-swipe.js.
export function PaneHandle() { return <div className={pn.grip} data-pane-grip="" aria-hidden="true" /> }
