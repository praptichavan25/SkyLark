import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import skyCloudsImg from '../assets/sky-clouds.jpg'
import '../styles/aircraft-window.css'

gsap.registerPlugin(ScrollTrigger)

export function AircraftWindowSequence() {
  const [activeStage, setActiveStage] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const windowWrapperRef = useRef<HTMLDivElement>(null)
  const outerBezelRef = useRef<HTMLDivElement>(null)
  const fullSkyRef = useRef<HTMLDivElement>(null)
  const cabinAtmosphereRef = useRef<HTMLDivElement>(null)
  const stage1TextRef = useRef<HTMLDivElement>(null)
  const stage2TextRef = useRef<HTMLDivElement>(null)
  const stage3TextRef = useRef<HTMLDivElement>(null)
  const telemetryRef = useRef<HTMLDivElement>(null)
  const topBarRef = useRef<HTMLDivElement>(null)
  const bottomBarRef = useRef<HTMLDivElement>(null)
  const stageListRef = useRef<HTMLDivElement>(null)
  const skyImageRef = useRef<HTMLImageElement>(null)
  const leftShutterRef = useRef<HTMLDivElement>(null)
  const rightShutterRef = useRef<HTMLDivElement>(null)
  const lightLeakRef = useRef<HTMLDivElement>(null)
  const closedObscurityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!containerRef.current) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
          onUpdate: (self) => {
            const p = self.progress
            if (p < 0.3) {
              setActiveStage(1)
            } else if (p < 0.72) {
              setActiveStage(2)
            } else {
              setActiveStage(3)
            }
          },
        },
      })

      // -------------------------------------------------------------
      // PHASE 1: Closed Window -> Opening Starts (0% - 25%)
      // -------------------------------------------------------------
      // Initial Stage 1 typography and telemetry fade out as opening begins
      tl.to(
        stage1TextRef.current,
        { opacity: 0, x: -50, duration: 0.2, ease: 'power2.out' },
        0.08
      )
      tl.to(
        telemetryRef.current,
        { opacity: 0, x: 40, duration: 0.2, ease: 'power2.out' },
        0.08
      )
      tl.to(
        [topBarRef.current, bottomBarRef.current],
        { opacity: 0, duration: 0.16, ease: 'power1.out' },
        0.08
      )

      // Light leak initial burst through the opening seam
      tl.fromTo(
        lightLeakRef.current,
        { opacity: 0, scaleX: 0.4 },
        { opacity: 0.95, scaleX: 1.4, duration: 0.22, ease: 'power2.out' },
        0.06
      )
      tl.to(
        lightLeakRef.current,
        { opacity: 0, scaleX: 3, duration: 0.25, ease: 'power1.in' },
        0.32
      )

      // -------------------------------------------------------------
      // PHASE 2: Dual Shutter Separation (Physical Window Opening) (0.08 - 0.72)
      // -------------------------------------------------------------
      // Left and right shutter panels retract symmetrically away from center
      tl.to(
        leftShutterRef.current,
        {
          xPercent: -102,
          duration: 0.62,
          ease: 'power2.inOut',
        },
        0.08
      )
      tl.to(
        rightShutterRef.current,
        {
          xPercent: 102,
          duration: 0.62,
          ease: 'power2.inOut',
        },
        0.08
      )

      // Ambient darkness inside window clears as daylight floods in
      tl.to(
        closedObscurityRef.current,
        { opacity: 0, duration: 0.35, ease: 'power2.out' },
        0.1
      )

      // Supporting subtle camera push (not a giant jump)
      tl.to(
        windowWrapperRef.current,
        {
          scale: 1.3,
          duration: 0.62,
          ease: 'power1.inOut',
        },
        0.08
      )

      // Subtle parallax movement of clouds behind the opening window
      tl.to(
        skyImageRef.current,
        {
          scale: 1.15,
          y: -15,
          ease: 'none',
          duration: 0.62,
        },
        0.08
      )

      // Stage 2: "LOOK CLOSER." appears midway while aperture is opening
      tl.fromTo(
        stage2TextRef.current,
        { opacity: 0, scale: 0.94, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.14, ease: 'power2.out' },
        0.32
      )
      tl.to(
        stage2TextRef.current,
        { opacity: 0, scale: 1.05, y: -15, duration: 0.14, ease: 'power2.in' },
        0.52
      )

      // -------------------------------------------------------------
      // PHASE 3: Fully Open -> Window Frame Dissolves -> Sky Dominates (0.72 - 1.0)
      // -------------------------------------------------------------
      // Now that the window is fully open, camera smoothly moves through into full sky
      tl.to(
        windowWrapperRef.current,
        {
          scale: 4.8,
          duration: 0.28,
          ease: 'power2.in',
        },
        0.7
      )

      // Full sky background takes over the entire viewport
      tl.to(
        cabinAtmosphereRef.current,
        { opacity: 0, duration: 0.24, ease: 'power1.inOut' },
        0.68
      )
      tl.to(
        fullSkyRef.current,
        { opacity: 1, duration: 0.24, ease: 'power1.inOut' },
        0.72
      )

      // Outer bezel dissolves away smoothly once aperture expands to screen edges
      tl.to(
        outerBezelRef.current,
        { opacity: 0, duration: 0.18, ease: 'power1.out' },
        0.76
      )

      // Stage pills fade out as we transition into pure horizon sky
      tl.to(
        stageListRef.current,
        { opacity: 0, duration: 0.14, ease: 'power1.out' },
        0.74
      )

      // Stage 3: "SEE WHERE YOU COULD GO." appears over the revealed sky
      tl.fromTo(
        stage3TextRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' },
        0.78
      )
      tl.to(
        stage3TextRef.current,
        { opacity: 0.95, duration: 0.12 },
        0.94
      )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const handleStageClick = (stageIndex: number) => {
    if (!containerRef.current) return
    const containerTop = containerRef.current.offsetTop
    const totalScroll = containerRef.current.offsetHeight - window.innerHeight
    let target = containerTop
    if (stageIndex === 1) target = containerTop
    if (stageIndex === 2) target = containerTop + totalScroll * 0.45
    if (stageIndex === 3) target = containerTop + totalScroll * 0.88
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  return (
    <section
      ref={containerRef}
      className="aircraft-sequence-container"
      aria-label="Aircraft Window Sequence"
    >
      <div className="aircraft-sticky-frame">
        {/* Fullscreen Sky Reveal Backdrop (Reveals at full open) */}
        <div ref={fullSkyRef} className="full-sky-backdrop" aria-hidden="true" />

        {/* Dark Cabin Interior Atmosphere */}
        <div ref={cabinAtmosphereRef} className="cabin-atmosphere" aria-hidden="true">
          <div className="cabin-vignette" />
          <div className="cabin-grain" />
        </div>

        {/* Top HUD Bar */}
        <header ref={topBarRef} className="cabin-top-bar">
          <div className="top-bar-left">
            <span className="top-bar-brand">SKYLARK</span>
            <span className="top-bar-divider" />
            <span className="top-bar-tag">CABIN PERSPECTIVE</span>
          </div>

          <div className="top-bar-right">
            <div className="cruise-badge">
              <span className="cruise-dot" />
              <span>CRUISE: FL410</span>
            </div>
            <span>01 / 03</span>
          </div>
        </header>

        {/* Approach Stage Selector on Right */}
        <aside
          ref={stageListRef}
          className="approach-stage-list"
          aria-label="Flight Stages"
        >
          <button
            type="button"
            className={`stage-pill ${activeStage === 1 ? 'active' : ''}`}
            onClick={() => handleStageClick(1)}
            aria-label="Stage 1 Approach"
          >
            <span className="stage-dot" />
            <span>01 CLOSED</span>
          </button>
          <button
            type="button"
            className={`stage-pill ${activeStage === 2 ? 'active' : ''}`}
            onClick={() => handleStageClick(2)}
            aria-label="Stage 2 Aperture"
          >
            <span className="stage-dot" />
            <span>02 OPENING</span>
          </button>
          <button
            type="button"
            className={`stage-pill ${activeStage === 3 ? 'active' : ''}`}
            onClick={() => handleStageClick(3)}
            aria-label="Stage 3 Horizon"
          >
            <span className="stage-dot" />
            <span>03 HORIZON</span>
          </button>
        </aside>

        {/* Stage 1: Left Editorial Content (Closed Window State) */}
        <div ref={stage1TextRef} className="editorial-left-content">
          <div className="editorial-micro-kicker">SKYLARK / 02</div>
          <h2 className="editorial-main-headline">
            <span>THE JOURNEY</span>
            <span>STARTS HERE.</span>
          </h2>
          <p className="editorial-body-subtext">
            Engineered for uncompromised calm and uninterrupted stillness above
            thirty-nine thousand feet.
          </p>
        </div>

        {/* Stage 1: Right Telemetry Column */}
        <div ref={telemetryRef} className="telemetry-column" aria-label="Flight Telemetry">
          <div className="telemetry-item">
            <span className="telemetry-label">CABIN PRESSURE</span>
            <span className="telemetry-value">6,000 FT EQUIV</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">AIRSPEED</span>
            <span className="telemetry-value">MACH 0.88</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">EXTERIOR TEMP</span>
            <span className="telemetry-value">-54°C</span>
          </div>
        </div>

        {/* Central Aircraft Window Assembly */}
        <div ref={windowWrapperRef} className="aircraft-window-wrapper">
          <div ref={outerBezelRef} className="window-outer-bezel">
            {/* Sunshade Housing at Top */}
            <div className="sunshade-recess">
              <div className="sunshade-handle" />
            </div>

            {/* Middle Recessed Rim */}
            <div className="window-middle-rim">
              {/* Inner Frame Housing (Holds Sky, Shutters, and Glass) */}
              <div className="window-inner-frame">
                {/* 1. Underlying Sky & Clouds Layer */}
                <div className="window-glass">
                  <img
                    ref={skyImageRef}
                    src={skyCloudsImg}
                    alt="High altitude sky and sea of clouds"
                    className="window-sky-image"
                  />
                  {/* Subtle Glass Reflection Sheen */}
                  <div className="window-glass-reflection" />
                  {/* Etched Watermark */}
                  <div className="window-glass-watermark">SKYLARK</div>
                </div>

                {/* 2. Closed State Obscurity Ambient Shadow */}
                <div ref={closedObscurityRef} className="window-closed-obscurity" />

                {/* 3. Central Volumetric Light Slit */}
                <div ref={lightLeakRef} className="shutter-light-leak" />

                {/* 4. Left Precision Shutter Panel */}
                <div ref={leftShutterRef} className="window-shutter window-shutter-left">
                  <div className="shutter-seam-tab" />
                </div>

                {/* 5. Right Precision Shutter Panel */}
                <div ref={rightShutterRef} className="window-shutter window-shutter-right">
                  <div className="shutter-seam-tab" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage 2 Text: "LOOK CLOSER." */}
        <div ref={stage2TextRef} className="approach-closer-text">
          <h3 className="approach-closer-heading">LOOK CLOSER.</h3>
          <p className="approach-closer-micro">APPROACHING CABIN APERTURE</p>
        </div>

        {/* Stage 3 Text: "SEE WHERE YOU COULD GO." */}
        <div ref={stage3TextRef} className="horizon-reveal-text">
          <h2 className="horizon-reveal-heading">
            <span>SEE WHERE</span>
            <span>YOU COULD GO.</span>
          </h2>
          <p className="horizon-reveal-subtext">
            ABOVE THE WEATHER. ABOVE EVERYTHING.
          </p>
        </div>

        {/* Bottom HUD Bar */}
        <footer ref={bottomBarRef} className="cabin-bottom-bar">
          <span>PRIVATE CHARTER SERVICE / NO. 2489</span>
          <button
            type="button"
            className="bottom-scroll-callout-btn"
            onClick={() => handleStageClick(2)}
            aria-label="Scroll to open aircraft window"
          >
            <span>SCROLL OR TAP TO OPEN</span>
            <div className="bottom-mouse-indicator">
              <div className="bottom-mouse-wheel" />
            </div>
          </button>
          <span>ALL-CABIN ACOUSTIC QUIET</span>
        </footer>
      </div>
    </section>
  )
}
