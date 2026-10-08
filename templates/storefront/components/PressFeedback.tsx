'use client'
import { useEffect } from 'react'
import b from '@/styles/btn.module.css'
import { installPressFeedback } from '../public/press-feedback.js'
export function PressFeedback() { useEffect(() => installPressFeedback(b.press), []); return null }
