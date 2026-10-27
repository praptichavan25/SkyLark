import { useEffect, useState } from 'react'
import '../styles/landing.css'

export function PageOneIntro() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Calculate subtle shift and fade as the user scrolls
  const scrollProgress = Math.min(scrollY / 250, 1)
  const centerTranslateY = -(scrollProgress * 24)
  const centerOpacity = Math.max(0, 1 - scrollProgress * 0.8)
  const scrollIndicatorOpacity = Math.max(0, 1 - scrollProgress * 3)

  return (
    <section className="cinematic-page" aria-label="SkyLark Opening Frame">
      {/* Cinematic Atmospheric Layers */}
      <div className="cinematic-atmosphere" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <div className="cinematic-grain" aria-hidden="true" />

      {/* Visual Center Composition */}
      <div
        className="center-composition"
        style={{
          transform: `translateY(${centerTranslateY}px)`,
          opacity: centerOpacity,
        }}
      >
        <span className="brand-micro-label">SKYLARK</span>

        <h1 className="statement-headline">
          <span>Flight discovery,</span>
          <span>reimagined.</span>
        </h1>

        <span className="statement-micro-subtext">PRIVATE FLIGHT DISCOVERY</span>
      </div>

      {/* Bottom Scroll Indicator */}
      <div
        className="scroll-indicator-container"
        style={{ opacity: scrollIndicatorOpacity }}
        aria-hidden="true"
      >
        <span className="scroll-text">SCROLL TO DISCOVER</span>
        <div className="scroll-line-indicator" />
        <svg
          className="scroll-arrow-icon"
          viewBox="0 0 10 6"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 1L5 5L9 1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
