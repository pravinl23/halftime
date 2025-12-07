"use client"

import { useEffect, useRef, useState } from 'react'

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [frames, setFrames] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)
  const requestRef = useRef<number>()
  const frameIndexRef = useRef(0)

  // Load frames
  useEffect(() => {
    import('@/lib/ascii-animation/frames.js')
      .then((module: any) => {
        const loadedFrames = module.frames || []
        console.log('✓ Loaded frames:', loadedFrames.length)
        setFrames(loadedFrames)
        setIsReady(true)
      })
      .catch((err) => {
        console.error('✗ Failed to load frames:', err)
      })
  }, [])

  // Animation and Scaling Logic
  useEffect(() => {
    if (!isReady || frames.length === 0 || !preRef.current || !containerRef.current) return

    const fps = 12
    const interval = 1000 / fps
    let lastTime = performance.now()

    // 1. Initial Content Set (to measure dimensions)
    preRef.current.innerText = frames[0]

    // 2. Measure and Scale Function
    const updateScale = () => {
      if (!preRef.current || !containerRef.current) return

      // Reset transform to get natural size
      preRef.current.style.transform = 'none'
      
      const containerWidth = window.innerWidth
      const containerHeight = window.innerHeight
      
      const contentWidth = preRef.current.offsetWidth
      const contentHeight = preRef.current.offsetHeight

      if (contentWidth === 0 || contentHeight === 0) return

      const scaleX = containerWidth / contentWidth
      const scaleY = containerHeight / contentHeight

      // Apply scale to fill the viewport exactly
      preRef.current.style.transform = `scale(${scaleX}, ${scaleY})`
      // Center the scaled element
      preRef.current.style.transformOrigin = 'top left'
    }

    // 3. Animation Loop
    const animate = (time: number) => {
      requestRef.current = requestAnimationFrame(animate)

      const elapsed = time - lastTime

      if (elapsed > interval) {
        lastTime = time - (elapsed % interval)
        
        // Advance frame
        frameIndexRef.current = (frameIndexRef.current + 1) % frames.length
        
        // Update DOM - using textContent is slightly faster than innerText
        if (preRef.current) {
          preRef.current.textContent = frames[frameIndexRef.current]
        }
      }
    }

    // Initialize
    updateScale() // Scale immediately based on first frame
    requestRef.current = requestAnimationFrame(animate)

    // Handle Resize
    const resizeObserver = new ResizeObserver(() => {
      updateScale()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      resizeObserver.disconnect()
    }
  }, [frames, isReady])

  if (!isReady) return null

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-transparent z-0 pointer-events-none select-none"
      style={{ contain: 'strict' }} // CSS optimization
    >
      <pre
        ref={preRef}
        className="absolute top-0 left-0 font-mono text-white origin-top-left"
        style={{
          margin: 0,
          padding: 0,
          fontSize: '10px',
          lineHeight: '10px', // Tight line height
          whiteSpace: 'pre',
          opacity: 0.15,
          willChange: 'transform, contents', // Hint to browser for performance
        }}
      />
    </div>
  )
}
