"use client"

import { useEffect, useRef } from "react"

export function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    updateSize()
    window.addEventListener("resize", updateSize)

    // Animation variables
    let rotation = 0
    const connections = [
      { from: { x: 0.3, y: 0.4 }, to: { x: 0.7, y: 0.3 } },
      { from: { x: 0.5, y: 0.6 }, to: { x: 0.8, y: 0.5 } },
      { from: { x: 0.2, y: 0.5 }, to: { x: 0.5, y: 0.3 } },
    ]

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      connections.forEach((conn, i) => {
        const phase = (rotation + i * 0.5) % (Math.PI * 2)
        const opacity = (Math.sin(phase) + 1) / 2

        ctx.strokeStyle = `rgba(236, 72, 153, ${opacity * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(conn.from.x * canvas.width, conn.from.y * canvas.height)
        ctx.lineTo(conn.to.x * canvas.width, conn.to.y * canvas.height)
        ctx.stroke()

        // Draw dots
        ;[conn.from, conn.to].forEach((point) => {
          ctx.fillStyle = `rgba(236, 72, 153, ${opacity})`
          ctx.beginPath()
          ctx.arc(point.x * canvas.width, point.y * canvas.height, 4, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      rotation += 0.02
      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateSize)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
