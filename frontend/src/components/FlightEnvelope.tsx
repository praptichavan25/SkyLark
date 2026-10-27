/**
 * SkyLark — Screen 4: FlightEnvelope
 *
 * REALISTIC PHYSICAL PAPER TEARING INTERACTION
 *
 * Features:
 *  1. Dual-piece paper geometry (Upper & Lower paper sections) rendered on HTML5 Canvas
 *  2. Irreversible tear: once torn, stays torn; user can release and resume tearing
 *  3. Deterministic, irregular jagged tear path (seeded noise, stable across frames)
 *  4. Paper thickness along torn edge (ivory core, subtle shadow, specular highlight)
 *  5. Physical paper tension: upper/lower paper deforms slightly right at the tear front
 *  6. Paper fibers stretching across the gap and snapping near the tearing head
 *  7. Tiny paper fragments (pulp specks) detaching and drifting down naturally
 *  8. Physical separation: upper paper lifts upward, lower paper drops downward as tear widens
 *  9. Real-time boarding pass reveal: realistic boarding card nestled inside pocket,
 *     glimpsed at 40-60%, clearly visible at 80%, fully slides forward at 100%
 * 10. Web Audio API synthesized sound: subtle friction on start, continuous fibrous tearing texture
 *     during forward drag, sharp layered paper rip on final break
 * 11. Auto-complete at 88% threshold with smooth physics-based finish
 * 12. Mobile haptic feedback at 25%, 50%, 75%, 100% milestones
 * 13. Accessible fallback: "OPEN ENVELOPE →" button, keyboard (Enter/Space), prefers-reduced-motion
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AIRPORT_MAP } from '../data/flightData'

/* ── COMPONENT PROPS ────────────────────────────────────────────────────────── */
export interface FlightEnvelopeProps {
  from: string
  to: string
  date: string
  ticketCount: number
  isOpen: boolean
  onOpen: () => void
}

/* ── CONSTANTS ──────────────────────────────────────────────────────────────── */
const AUTO_OPEN_THRESHOLD = 0.88 // 88% triggers smooth auto-completion
const ENVELOPE_WIDTH = 780
const ENVELOPE_HEIGHT = 420
const TEAR_BASELINE_RATIO = 0.54 // vertical placement of tear strip (54% from top)

/* ── WEB AUDIO SYNTHESIZER ─────────────────────────────────────────────────── */
class PaperAudioEngine {
  private ctx: AudioContext | null = null
  private lastGranuleTime = 0
  private lastFrictionTime = 0

  private getCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /** Subtle paper friction sound when user touches / moves pointer */
  playFriction() {
    const ctx = this.getCtx()
    if (!ctx) return
    const now = ctx.currentTime
    if (now - this.lastFrictionTime < 0.1) return
    this.lastFrictionTime = now

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.045)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI) * 0.1
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 520

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045)

      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      source.start(now)
    } catch {}
  }

  /** Continuous fibrous paper-tearing texture as the tear line advances */
  playTearGranule(intensity = 0.5) {
    const ctx = this.getCtx()
    if (!ctx) return
    const now = ctx.currentTime
    if (now - this.lastGranuleTime < 0.032) return // throttle to ~30Hz
    this.lastGranuleTime = now

    try {
      const dur = 0.016 + Math.random() * 0.014
      const bufferSize = Math.floor(ctx.sampleRate * dur)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.pow(1 - i / bufferSize, 0.75)
        data[i] = (Math.random() * 2 - 1) * env * (0.16 + intensity * 0.22)
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 950 + Math.random() * 1100
      filter.Q.value = 2.4

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.24, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur)

      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      source.start(now)
    } catch {}
  }

  /** Sharp, crisp final paper break when envelope is completely ripped open */
  playFinalRip() {
    const ctx = this.getCtx()
    if (!ctx) return
    const now = ctx.currentTime

    try {
      // 1. Transient high-frequency snap
      const snapDur = 0.045
      const snapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * snapDur), ctx.sampleRate)
      const snapData = snapBuf.getChannelData(0)
      for (let i = 0; i < snapBuf.length; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snapBuf.length, 0.45) * 0.38
      }
      const snapSrc = ctx.createBufferSource()
      snapSrc.buffer = snapBuf
      const snapFilter = ctx.createBiquadFilter()
      snapFilter.type = 'highpass'
      snapFilter.frequency.value = 1900
      const snapGain = ctx.createGain()
      snapGain.gain.setValueAtTime(0.38, now)
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + snapDur)
      snapSrc.connect(snapFilter)
      snapFilter.connect(snapGain)
      snapGain.connect(ctx.destination)
      snapSrc.start(now)

      // 2. Main fibrous rip resonance
      const ripDur = 0.24
      const ripBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * ripDur), ctx.sampleRate)
      const ripData = ripBuf.getChannelData(0)
      for (let i = 0; i < ripBuf.length; i++) {
        const env =
          i < ripBuf.length * 0.12
            ? i / (ripBuf.length * 0.12)
            : Math.pow(1 - (i - ripBuf.length * 0.12) / (ripBuf.length * 0.88), 1.3)
        ripData[i] = (Math.random() * 2 - 1) * env * 0.35
      }
      const ripSrc = ctx.createBufferSource()
      ripSrc.buffer = ripBuf
      const ripFilter = ctx.createBiquadFilter()
      ripFilter.type = 'bandpass'
      ripFilter.frequency.value = 1350
      ripFilter.Q.value = 1.8
      const ripGain = ctx.createGain()
      ripGain.gain.setValueAtTime(0.36, now)
      ripGain.gain.exponentialRampToValueAtTime(0.001, now + ripDur)
      ripSrc.connect(ripFilter)
      ripFilter.connect(ripGain)
      ripGain.connect(ctx.destination)
      ripSrc.start(now)
    } catch {}
  }
}

const audio = new PaperAudioEngine()

/* ── DETERMINISTIC JAGGED TEAR PATH GENERATION ─────────────────────────────── */
interface TearPathNode {
  x: number
  baseOffset: number   // jagged displacement from baseY (-7 to +7 px)
  toothUpper: number   // micro fibrous tooth upward
  toothLower: number   // micro fibrous tooth downward
  hasPerforation: boolean
}

function generateDeterministicTearPath(width: number): TearPathNode[] {
  const nodes: TearPathNode[] = []
  const step = 2 // sample every 2px for smooth, dense paper geometry
  const count = Math.ceil(width / step) + 1

  // Mulberry32 seeded PRNG for consistent, non-jittering geometry
  let seed = 849204
  const rand = () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  for (let i = 0; i <= count; i++) {
    const x = i * step
    // Smooth natural shear wave across envelope paper
    const macro = Math.sin(x * 0.012) * 3.2 + Math.cos(x * 0.028) * 2.2
    // Medium fibrous tears along perforation punches
    const meso = (rand() - 0.5) * 3.8
    // Micro paper grain
    const micro = (rand() - 0.5) * 1.6

    const baseOffset = macro + meso + micro
    const toothUpper = (rand() - 0.5) * 2.0
    const toothLower = (rand() - 0.5) * 2.0
    // Perforation hole every 14px
    const hasPerforation = x % 14 < step

    nodes.push({ x, baseOffset, toothUpper, toothLower, hasPerforation })
  }
  return nodes
}

/* ── DETACHED PAPER FRAGMENT TYPE ─────────────────────────────────────────── */
interface PaperFragment {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  vRot: number
  opacity: number
  life: number
  maxLife: number
}

/* ── COMPONENT ─────────────────────────────────────────────────────────────── */
export function FlightEnvelope({
  from,
  to,
  date,
  ticketCount,
  isOpen,
  onOpen,
}: FlightEnvelopeProps) {
  const fromCity = AIRPORT_MAP[from]?.city ?? from
  const toCity = AIRPORT_MAP[to]?.city ?? to

  /* State */
  const [tearProgress, setTearProgress] = useState(0) // 0 to 1
  const [isDragging, setIsDragging] = useState(false)
  const [isBroken, setIsBroken] = useState(false)
  const [isFullyOpened, setIsFullyOpened] = useState(false)

  /* Refs for animation loop and gesture tracking */
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tearProgressRef = useRef(0)
  const maxTearProgressRef = useRef(0) // irreversible: stays at maximum reached
  const isDraggingRef = useRef(false)
  const isBrokenRef = useRef(false)
  const lastAdvanceXRef = useRef(0)
  const tensionFactorRef = useRef(0) // 0 to 1 during active pull

  const tearNodesRef = useRef<TearPathNode[]>([])
  const fragmentsRef = useRef<PaperFragment[]>([])
  const triggeredHapticsRef = useRef<Set<number>>(new Set())
  const animationFrameIdRef = useRef<number | null>(null)

  /* Check reduced motion */
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  /* Initialize deterministic tear path */
  useEffect(() => {
    tearNodesRef.current = generateDeterministicTearPath(ENVELOPE_WIDTH)
  }, [])

  /* Reset envelope state when repacked (isOpen becomes false) */
  useEffect(() => {
    if (!isOpen) {
      tearProgressRef.current = 0
      maxTearProgressRef.current = 0
      isBrokenRef.current = false
      setTearProgress(0)
      setIsBroken(false)
      setIsFullyOpened(false)
      triggeredHapticsRef.current.clear()
      fragmentsRef.current = []
    }
  }, [isOpen])

  /* ── MOBILE HAPTIC FEEDBACK ─────────────────────────────────────────────── */
  const triggerHaptic = useCallback((level: number) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (!triggeredHapticsRef.current.has(level)) {
        triggeredHapticsRef.current.add(level)
        if (level === 100) {
          navigator.vibrate([25, 30, 45])
        } else {
          navigator.vibrate(14)
        }
      }
    }
  }, [])

  /* ── AUTO-COMPLETE FINAL RIP SEQUENCE ──────────────────────────────────── */
  const executeFinalRip = useCallback(() => {
    if (isBrokenRef.current) return
    isBrokenRef.current = true
    setIsBroken(true)
    audio.playFinalRip()
    triggerHaptic(100)

    if (prefersReduced) {
      maxTearProgressRef.current = 1
      tearProgressRef.current = 1
      setTearProgress(1)
      setIsFullyOpened(true)
      onOpen()
      return
    }

    // Smoothly animate the final 10-15% tear and physical separation
    const startProgress = tearProgressRef.current
    const startTime = performance.now()
    const duration = 400 // ms

    const animateRip = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const current = startProgress + (1 - startProgress) * eased
      tearProgressRef.current = current
      maxTearProgressRef.current = current
      setTearProgress(current)

      if (t < 1) {
        requestAnimationFrame(animateRip)
      } else {
        // Separation stage: boarding passes emerge, notify parent
        setTimeout(() => {
          setIsFullyOpened(true)
          onOpen()
        }, 350)
      }
    }
    requestAnimationFrame(animateRip)
  }, [onOpen, prefersReduced, triggerHaptic])

  /* ── ACCESSIBLE ONE-CLICK / KEYBOARD OPEN ────────────────────────────────── */
  const handleAccessibleOpen = useCallback(() => {
    if (isBrokenRef.current) return
    audio.playFriction()
    isDraggingRef.current = true

    if (prefersReduced) {
      executeFinalRip()
      return
    }

    // Smooth animation from current progress to 100%
    const startProgress = tearProgressRef.current
    const startTime = performance.now()
    const duration = 650

    const step = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = t * t * (3 - 2 * t) // smoothstep
      const p = startProgress + (0.9 - startProgress) * eased
      tearProgressRef.current = p
      maxTearProgressRef.current = p
      setTearProgress(p)
      audio.playTearGranule(0.4)

      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        isDraggingRef.current = false
        executeFinalRip()
      }
    }
    requestAnimationFrame(step)
  }, [executeFinalRip, prefersReduced])

  /* ── POINTER GESTURE HANDLERS ───────────────────────────────────────────── */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isBrokenRef.current) return
      e.currentTarget.setPointerCapture(e.pointerId)
      isDraggingRef.current = true
      setIsDragging(true)
      tensionFactorRef.current = 1
      audio.playFriction()

      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const normX = Math.max(0, Math.min(1, clickX / rect.width))

      // If user clicks ahead of max progress, advance
      if (normX > maxTearProgressRef.current) {
        maxTearProgressRef.current = normX
        tearProgressRef.current = normX
        setTearProgress(normX)
      }
    },
    []
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || isBrokenRef.current) return

      const rect = e.currentTarget.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const rawProgress = Math.max(0, Math.min(1, currentX / rect.width))

      // IRREVERSIBLE: the tear only advances forward, never heals
      if (rawProgress > maxTearProgressRef.current) {
        const deltaProgress = rawProgress - maxTearProgressRef.current
        maxTearProgressRef.current = rawProgress
        tearProgressRef.current = rawProgress
        setTearProgress(rawProgress)

        // Spawn granular sound
        audio.playTearGranule(Math.min(1, deltaProgress * 8))

        // Haptic milestones
        if (rawProgress >= 0.25) triggerHaptic(25)
        if (rawProgress >= 0.5) triggerHaptic(50)
        if (rawProgress >= 0.75) triggerHaptic(75)

        // Spawn detached paper pulp fragments occasionally
        const currentPixelX = rawProgress * ENVELOPE_WIDTH
        if (Math.abs(currentPixelX - lastAdvanceXRef.current) > 18) {
          lastAdvanceXRef.current = currentPixelX
          if (Math.random() > 0.35 && fragmentsRef.current.length < 8) {
            const baseY = ENVELOPE_HEIGHT * TEAR_BASELINE_RATIO
            fragmentsRef.current.push({
              x: currentPixelX,
              y: baseY + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.8,
              vy: 0.8 + Math.random() * 1.4,
              size: 1.6 + Math.random() * 2.2,
              rotation: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.2,
              opacity: 0.95,
              life: 0,
              maxLife: 28 + Math.floor(Math.random() * 18),
            })
          }
        }

        // Auto-complete if >= 88%
        if (rawProgress >= AUTO_OPEN_THRESHOLD) {
          isDraggingRef.current = false
          setIsDragging(false)
          executeFinalRip()
        }
      }
    },
    [executeFinalRip, triggerHaptic]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
      isDraggingRef.current = false
      setIsDragging(false)
      tensionFactorRef.current = 0

      // If user released near threshold, auto-complete
      if (maxTearProgressRef.current >= AUTO_OPEN_THRESHOLD) {
        executeFinalRip()
      }
    },
    [executeFinalRip]
  )

  /* Keyboard activation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleAccessibleOpen()
      }
    },
    [handleAccessibleOpen]
  )

  /* ── CANVAS RENDERING LOOP ──────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let isMounted = true

    const render = () => {
      if (!isMounted) return

      const W = ENVELOPE_WIDTH
      const H = ENVELOPE_HEIGHT
      const baseY = H * TEAR_BASELINE_RATIO
      const progress = tearProgressRef.current
      const currentTearX = progress * W
      const nodes = tearNodesRef.current

      // Set canvas size accounting for DPR
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr
        canvas.height = H * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, W, H)

      if (nodes.length === 0) {
        ctx.restore()
        animationFrameIdRef.current = requestAnimationFrame(render)
        return
      }

      /* Helper for physical separation at given X */
      const getSeparation = (x: number) => {
        if (x > currentTearX) {
          // Untorn section: small tension stretch right at tear head
          if (isDraggingRef.current && x - currentTearX < 24) {
            const tension =
              (1 - (x - currentTearX) / 24) * 2.8 * tensionFactorRef.current
            return { upper: -tension, lower: tension }
          }
          return { upper: 0, lower: 0 }
        }
        // Torn section: natural curl and widening gap
        const distFromHead = currentTearX - x
        // Widest at left edge, smoothly tapering to tear front
        const lift =
          Math.min(24, 3.5 + Math.pow(distFromHead / 120, 0.72) * 16) *
          (0.65 + 0.35 * progress)
        const drop =
          Math.min(22, 3.2 + Math.pow(distFromHead / 120, 0.72) * 14) *
          (0.65 + 0.35 * progress)

        // Extra separation during broken stage
        const breakBonus = isBrokenRef.current ? 18 : 0
        return { upper: -(lift + breakBonus), lower: drop + breakBonus }
      }

      /* ── 1. DRAW UPPER PAPER SECTION ─────────────────────────────────── */
      ctx.save()
      ctx.beginPath()
      // Top boundary
      ctx.moveTo(0, 0)
      ctx.lineTo(W, 0)
      ctx.lineTo(W, baseY)

      // Untorn perforation line (right to left until currentTearX)
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i]
        if (node.x >= currentTearX) {
          ctx.lineTo(node.x, baseY)
        } else {
          // Torn jagged edge displaced upward
          const sep = getSeparation(node.x)
          const yTorn = baseY + node.baseOffset + node.toothUpper + sep.upper
          ctx.lineTo(node.x, yTorn)
        }
      }
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.clip()

      // Fill upper envelope gradient
      const gradUpper = ctx.createLinearGradient(0, 0, W, baseY)
      gradUpper.addColorStop(0, '#1c74d9')
      gradUpper.addColorStop(0.5, '#1565c0')
      gradUpper.addColorStop(1, '#0d4e9b')
      ctx.fillStyle = gradUpper
      ctx.fillRect(0, 0, W, baseY + 40)

      // Subtle airmail border stripes along top edge
      drawAirmailBorder(ctx, 0, 0, W, 8)

      // Upper Envelope Content
      drawUpperEnvelopeGraphics(ctx, from, fromCity, date)
      ctx.restore()

      /* ── 2. DRAW LOWER PAPER SECTION ─────────────────────────────────── */
      ctx.save()
      ctx.beginPath()
      // Bottom-left corner
      ctx.moveTo(0, H)

      // Torn jagged edge from x=0 to currentTearX (left to right)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.x <= currentTearX) {
          const sep = getSeparation(node.x)
          const yTorn = baseY + node.baseOffset + node.toothLower + sep.lower
          ctx.lineTo(node.x, yTorn)
        } else {
          // Untorn perforation line
          ctx.lineTo(node.x, baseY)
        }
      }

      // Bottom boundary
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.closePath()
      ctx.clip()

      // Fill lower envelope gradient
      const gradLower = ctx.createLinearGradient(0, baseY, W, H)
      gradLower.addColorStop(0, '#125eb5')
      gradLower.addColorStop(0.6, '#0f52a3')
      gradLower.addColorStop(1, '#093a78')
      ctx.fillStyle = gradLower
      ctx.fillRect(0, baseY - 40, W, H - baseY + 40)

      // Subtle airmail border stripes along bottom edge
      drawAirmailBorder(ctx, 0, H - 8, W, 8)

      // Lower Envelope Content
      drawLowerEnvelopeGraphics(ctx, to, toCity, ticketCount)
      ctx.restore()

      /* ── 3. TORN PAPER EDGES: THICKNESS, SHADOW & FIBERS ─────────────── */
      if (currentTearX > 2) {
        // Upper torn edge: Shadow underneath
        ctx.save()
        ctx.beginPath()
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (node.x <= currentTearX) {
            const sep = getSeparation(node.x)
            const y = baseY + node.baseOffset + node.toothUpper + sep.upper
            if (i === 0) ctx.moveTo(node.x, y + 2)
            else ctx.lineTo(node.x, y + 2)
          }
        }
        ctx.strokeStyle = 'rgba(7, 28, 58, 0.45)'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Upper torn edge: Exposed ivory fibrous paper core
        ctx.beginPath()
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (node.x <= currentTearX) {
            const sep = getSeparation(node.x)
            const y = baseY + node.baseOffset + node.toothUpper + sep.upper
            if (i === 0) ctx.moveTo(node.x, y)
            else ctx.lineTo(node.x, y)
          }
        }
        ctx.strokeStyle = '#FAF6EC'
        ctx.lineWidth = 2.0
        ctx.stroke()

        // Upper torn edge: Delicate specular highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Lower torn edge: Exposed ivory paper core & inner shadow
        ctx.beginPath()
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if (node.x <= currentTearX) {
            const sep = getSeparation(node.x)
            const y = baseY + node.baseOffset + node.toothLower + sep.lower
            if (i === 0) ctx.moveTo(node.x, y)
            else ctx.lineTo(node.x, y)
          }
        }
        ctx.strokeStyle = '#FAF6EC'
        ctx.lineWidth = 2.0
        ctx.stroke()

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
        ctx.lineWidth = 0.7
        ctx.stroke()
        ctx.restore()

        /* ── 4. STRETCHING & SNAPPING PAPER FIBERS ────────────────────── */
        // Fibers exist near the active tearing head (within 35px behind currentTearX)
        const fiberStartX = Math.max(0, currentTearX - 35)
        ctx.save()
        for (let fx = fiberStartX; fx < currentTearX; fx += 5.5) {
          const upperSep = getSeparation(fx).upper
          const lowerSep = getSeparation(fx).lower
          const dist = Math.abs(lowerSep - upperSep)
          const maxStretch = 15 // fibers snap when gap exceeds 15px

          if (dist < maxStretch) {
            const nodeIdx = Math.min(
              nodes.length - 1,
              Math.max(0, Math.floor(fx / 2))
            )
            const node = nodes[nodeIdx] || { baseOffset: 0 }
            const yUp = baseY + node.baseOffset + upperSep
            const yDown = baseY + node.baseOffset + lowerSep

            // Stretched ivory fiber strand
            ctx.beginPath()
            ctx.moveTo(fx, yUp)
            ctx.lineTo(fx + 2.5, yDown)
            const fiberAlpha = (1 - dist / maxStretch) * 0.85
            ctx.strokeStyle = `rgba(250, 246, 235, ${fiberAlpha})`
            ctx.lineWidth = 0.9
            ctx.stroke()
          }
        }
        ctx.restore()
      }

      /* ── 5. UNTORN PERFORATION GUIDE ─────────────────────────────────── */
      if (currentTearX < W - 4) {
        ctx.save()
        const unTornStartX = Math.max(currentTearX, 0)
        // Perforation needle holes
        for (let x = unTornStartX + 12; x < W - 14; x += 14) {
          // Dark punched needle hole
          ctx.beginPath()
          ctx.arc(x, baseY, 1.4, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(10, 42, 85, 0.75)'
          ctx.fill()
          // Subtle embossed highlight rim
          ctx.beginPath()
          ctx.arc(x, baseY + 0.8, 1.4, 0, Math.PI * 0.9)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
          ctx.lineWidth = 0.7
          ctx.stroke()
        }

        // Instruction guide label (fades out as tear advances)
        if (progress < 0.45) {
          const labelAlpha = Math.max(0, 1 - progress * 2.4)
          ctx.font = '700 11px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = `rgba(255, 255, 255, ${labelAlpha * 0.75})`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const labelX = Math.min(W - 130, unTornStartX + 120)
          ctx.fillText('DRAG TO TEAR OPEN ────→', labelX, baseY - 16)
        }
        ctx.restore()
      }

      /* ── 6. UPDATE & DRAW DETACHED PAPER FRAGMENTS ───────────────────── */
      ctx.save()
      const frags = fragmentsRef.current
      for (let i = frags.length - 1; i >= 0; i--) {
        const f = frags[i]
        f.x += f.vx
        f.y += f.vy
        f.vy += 0.12 // gravity
        f.rotation += f.vRot
        f.life++
        f.opacity = Math.max(0, 1 - f.life / f.maxLife)

        if (f.life >= f.maxLife) {
          frags.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate(f.rotation)
        ctx.fillStyle = `rgba(250, 246, 235, ${f.opacity * 0.9})`
        ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size * 0.8)
        ctx.restore()
      }
      ctx.restore()

      ctx.restore() // restore root dpr scale

      animationFrameIdRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      isMounted = false
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [date, from, fromCity, ticketCount, to, toCity])

  /* ── GRAPHIC RENDER HELPERS FOR ENVELOPE CANVAS ────────────────────────── */
  function drawAirmailBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const stripeWidth = 14
    let currentX = x
    let idx = 0
    ctx.save()
    while (currentX < x + width) {
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(235, 75, 75, 0.65)' : 'rgba(255, 255, 255, 0.7)'
      ctx.beginPath()
      ctx.moveTo(currentX, y)
      ctx.lineTo(currentX + stripeWidth, y)
      ctx.lineTo(currentX + stripeWidth - 4, y + height)
      ctx.lineTo(currentX - 4, y + height)
      ctx.closePath()
      ctx.fill()
      currentX += stripeWidth + 6
      idx++
    }
    ctx.restore()
  }

  function drawUpperEnvelopeGraphics(
    ctx: CanvasRenderingContext2D,
    originCode: string,
    originCity: string,
    travelDate: string
  ) {
    // Top-left Brand
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 24px "DM Serif Display", Georgia, serif'
    ctx.fillText('SKYLARK', 36, 44)

    ctx.font = '700 9px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.letterSpacing = '2px'
    ctx.fillText('AIR MAIL DISPATCH · PRIORITY SERVICE', 36, 62)

    // Postal stamp in top-right corner
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.strokeRect(ENVELOPE_WIDTH - 110, 24, 74, 52)
    ctx.setLineDash([])

    ctx.font = '16px system-ui'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('✈', ENVELOPE_WIDTH - 82, 48)

    ctx.font = '800 7px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.textAlign = 'center'
    ctx.fillText('PRIORITY', ENVELOPE_WIDTH - 73, 62)
    ctx.fillText('AIR POST', ENVELOPE_WIDTH - 73, 71)
    ctx.restore()

    // Route origin display
    ctx.fillStyle = '#9bd0ff'
    ctx.font = '800 9.5px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '1.8px'
    ctx.fillText('CONFIRMED FLIGHT ITINERARY', 36, 110)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 42px "DM Serif Display", Georgia, serif'
    ctx.fillText(originCode, 36, 156)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.font = '600 12.5px system-ui, -apple-system, sans-serif'
    ctx.fillText(originCity.toUpperCase(), 38, 178)

    // Departure badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.fillRect(ENVELOPE_WIDTH - 210, 126, 174, 28)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.strokeRect(ENVELOPE_WIDTH - 210, 126, 174, 28)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 10px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`DEPARTURE · ${travelDate}`, ENVELOPE_WIDTH - 123, 143)
    ctx.textAlign = 'left'
  }

  function drawLowerEnvelopeGraphics(
    ctx: CanvasRenderingContext2D,
    destCode: string,
    destCity: string,
    enclosedCount: number
  ) {
    const H = ENVELOPE_HEIGHT

    // Destination Route display
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '600 11px system-ui, -apple-system, sans-serif'
    ctx.fillText('DESTINATION', 36, 268)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 42px "DM Serif Display", Georgia, serif'
    ctx.fillText(destCode, 36, 314)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.font = '600 12.5px system-ui, -apple-system, sans-serif'
    ctx.fillText(destCity.toUpperCase(), 38, 336)

    // Tickets enclosed badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.fillRect(ENVELOPE_WIDTH - 230, 276, 194, 30)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.strokeRect(ENVELOPE_WIDTH - 230, 276, 194, 30)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 10.5px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      `✈  ${enclosedCount} BOARDING PASSES ENCLOSED`,
      ENVELOPE_WIDTH - 133,
      295
    )
    ctx.textAlign = 'left'

    // Bottom official document notice
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.font = '600 9px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '1.5px'
    ctx.fillText(
      'OFFICIAL PASSENGER TRAVEL DOCUMENT · SKY LARK AVIATION NETWORK',
      36,
      H - 22
    )
  }

  /* ── DERIVED UI VALUES ──────────────────────────────────────────────────── */
  const handleXPercent = Math.min(Math.max(tearProgress * 100, 0), 96)
  const isNearlyOpen = tearProgress >= 0.75

  return (
    <div
      ref={containerRef}
      className={[
        'fe-physical-scene',
        isBroken ? 'fe-physical-scene--broken' : '',
        isFullyOpened ? 'fe-physical-scene--opened' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Skylark physical airline envelope"
    >
      {/* ── ENVELOPE CARD WRAPPER ─────────────────────────────────────────── */}
      <div
        className={[
          'fe-envelope-packet',
          isDragging ? 'fe-envelope-packet--dragging' : '',
          isBroken ? 'fe-envelope-packet--broken' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* ── INTERIOR POCKET WITH REALISTIC BOARDING PASS (Reference 2) ── */}
        <div className="fe-pocket-interior" aria-hidden="true">
          <div className="fe-pocket-liner" />

          {/* Realistic Boarding Pass Ticket revealed behind the torn gap */}
          <div
            className={[
              'fe-interior-ticket',
              isNearlyOpen ? 'fe-interior-ticket--revealed' : '',
              isBroken ? 'fe-interior-ticket--emerging' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Ticket Header */}
            <div className="fe-itick-header">
              <div className="fe-itick-brand">
                <span className="fe-itick-airline">SKYLARK AIRLINES</span>
                <span className="fe-itick-sub">BOARDING PASS</span>
              </div>
              <div className="fe-itick-class">PRIORITY PASSENGER</div>
            </div>

            {/* Ticket Route & Details */}
            <div className="fe-itick-body">
              <div className="fe-itick-route">
                <div className="fe-itick-city">
                  <span className="fe-itick-iata">{from}</span>
                  <span className="fe-itick-cityname">{fromCity}</span>
                </div>
                <div className="fe-itick-flightpath">
                  <span className="fe-itick-flightno">AI-204</span>
                  <div className="fe-itick-line">
                    <span className="fe-itick-plane">✈</span>
                  </div>
                  <span className="fe-itick-classbadge">ECONOMY</span>
                </div>
                <div className="fe-itick-city">
                  <span className="fe-itick-iata">{to}</span>
                  <span className="fe-itick-cityname">{toCity}</span>
                </div>
              </div>

              {/* Passenger Metadata Row */}
              <div className="fe-itick-meta">
                <div className="fe-itick-meta-item">
                  <span className="fe-itick-meta-k">DATE</span>
                  <span className="fe-itick-meta-v">{date}</span>
                </div>
                <div className="fe-itick-meta-item">
                  <span className="fe-itick-meta-k">SEAT</span>
                  <span className="fe-itick-meta-v">14B</span>
                </div>
                <div className="fe-itick-meta-item">
                  <span className="fe-itick-meta-k">GATE</span>
                  <span className="fe-itick-meta-v">G-04</span>
                </div>
                <div className="fe-itick-meta-item">
                  <span className="fe-itick-meta-k">BOARDING</span>
                  <span className="fe-itick-meta-v">10:15 AM</span>
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="fe-itick-barcode">
                <div className="fe-itick-barcode-lines" />
                <span className="fe-itick-barcode-num">
                  SKL-7749-0182-BOM-DEL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── THE PHYSICAL PAPER CANVAS (Front of Envelope) ──────────────── */}
        <canvas
          ref={canvasRef}
          className="fe-paper-canvas"
          width={ENVELOPE_WIDTH}
          height={ENVELOPE_HEIGHT}
          aria-hidden="true"
        />

        {/* ── DRAGGABLE AIRPLANE HANDLE ✈ ─────────────────────────────────── */}
        {!isBroken && (
          <div
            className={[
              'fe-tear-handle',
              isDragging ? 'fe-tear-handle--active' : '',
              tearProgress > 0 ? 'fe-tear-handle--moved' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              left: `${handleXPercent}%`,
              top: `${TEAR_BASELINE_RATIO * 100}%`,
            }}
            role="slider"
            aria-label="Airplane tear handle. Swipe horizontally to rip open paper envelope."
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(tearProgress * 100)}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            <div className="fe-handle-pulse-ring" aria-hidden="true" />
            <div className="fe-handle-circle">
              <svg viewBox="0 0 24 24" className="fe-handle-plane-icon">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
            </div>
            {tearProgress === 0 && (
              <span className="fe-handle-hint" aria-hidden="true">
                DRAG ✈
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── ACCESSIBLE FOOTER ACTION BAR ──────────────────────────────────── */}
      <div className="fe-scene-actions">
        <span className="fe-scene-kicker">
          {tearProgress === 0
            ? '✈ Drag the airplane handle across the dotted line to tear open'
            : isBroken
            ? '✓ Seal torn open — revealing your boarding passes'
            : `Tearing envelope: ${Math.round(tearProgress * 100)}%`}
        </span>

        {/* Accessible fallback button */}
        <button
          type="button"
          className="fe-accessible-btn"
          onClick={handleAccessibleOpen}
          aria-label="Open flight envelope immediately"
          disabled={isBroken}
        >
          OPEN ENVELOPE →
        </button>
      </div>

      {/* Screen reader live region announcements */}
      <div aria-live="polite" aria-atomic="true" className="fe-sr-only">
        {isDragging && `Tearing paper envelope: ${Math.round(tearProgress * 100)}%`}
        {isBroken && 'Paper seal ripped open. Boarding tickets are appearing.'}
        {isFullyOpened && 'Envelope opened. Flight ticket carousel is active.'}
      </div>
    </div>
  )
}
