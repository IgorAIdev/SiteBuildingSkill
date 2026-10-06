'use client'
import { useEffect } from 'react'
import { installPaneSwipe } from '../public/pane-swipe.js'

// One gesture engine for the application and its static preview export.
export function PaneSwipe() {
  useEffect(installPaneSwipe, [])
  return null
}
