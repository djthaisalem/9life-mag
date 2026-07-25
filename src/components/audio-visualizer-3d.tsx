'use client'

import { useEffect, useRef, useState } from 'react'

type AudioVisualizerProps = {
  analyser: AnalyserNode | null
  isPlaying: boolean
  trackId: string
}

const TURTLE_PRESETS = ['weave', 'petals', 'spiral', 'fan', 'spirograph', 'tunnel'] as const

function color(hue: number, alpha = 0.85) {
  return `hsla(${Math.round(hue % 360)}, 95%, 67%, ${alpha})`
}

export function AudioVisualizer3D({ analyser, isPlaying, trackId }: Readonly<AudioVisualizerProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      setIsUnavailable(true)
      return
    }

    setIsUnavailable(false)
    let frameId = 0
    let lastFrame = 0
    let lastPreset = -1
    let bassAverage = 0
    let beatPulse = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    const data = new Uint8Array(analyser?.frequencyBinCount ?? 256)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1 : 1.25)
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(width * pixelRatio)
      canvas.height = Math.floor(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.fillStyle = '#02070d'
      context.fillRect(0, 0, width, height)
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const getBand = (index: number) => data[Math.min(data.length - 1, Math.max(0, index % data.length))] / 255
    const drawLine = (points: readonly [number, number][], hue: number, lineWidth = 1, alpha = 0.82) => {
      if (points.length < 2) return
      context.beginPath()
      context.moveTo(points[0][0], points[0][1])
      points.slice(1).forEach(([x, y]) => context.lineTo(x, y))
      context.strokeStyle = color(hue, alpha)
      context.lineWidth = lineWidth
      context.stroke()
    }

    const drawWeave = (centerX: number, centerY: number, radius: number, time: number, energy: number) => {
      const shapes = 28
      for (let shape = 0; shape < shapes; shape += 1) {
        const rotation = time * 0.24 + (shape / shapes) * Math.PI * 2
        const pulse = 1 + getBand(shape * 3) * 0.32 + energy * 0.18
        const points: [number, number][] = []
        for (let corner = 0; corner <= 4; corner += 1) {
          const angle = rotation + corner * Math.PI / 2
          points.push([centerX + Math.cos(angle) * radius * pulse, centerY + Math.sin(angle) * radius * pulse])
        }
        drawLine(points, shape * 13 + time * 14, 0.8, 0.58)
      }
    }

    const drawPetals = (centerX: number, centerY: number, radius: number, time: number, energy: number) => {
      const petals = 16
      for (let petal = 0; petal < petals; petal += 1) {
        const angle = (petal / petals) * Math.PI * 2 + time * 0.16
        const band = getBand(petal * 4)
        const length = radius * (0.64 + band * 0.48 + energy * 0.2)
        for (let line = 0; line < 9; line += 1) {
          const spread = (line - 4) * 0.055
          const startX = centerX + Math.cos(angle - spread) * radius * 0.13
          const startY = centerY + Math.sin(angle - spread) * radius * 0.13
          const endX = centerX + Math.cos(angle + spread) * length
          const endY = centerY + Math.sin(angle + spread) * length
          const controlX = centerX + Math.cos(angle + Math.PI / 2) * length * (0.42 + line * 0.018)
          const controlY = centerY + Math.sin(angle + Math.PI / 2) * length * (0.42 + line * 0.018)
          context.beginPath()
          context.moveTo(startX, startY)
          context.quadraticCurveTo(controlX, controlY, endX, endY)
          context.strokeStyle = color(petal * 22 + line * 5 + time * 10, 0.72)
          context.lineWidth = 0.85
          context.stroke()
        }
      }
    }

    const drawSpiral = (centerX: number, centerY: number, radius: number, time: number, energy: number) => {
      for (let arm = 0; arm < 9; arm += 1) {
        const points: [number, number][] = []
        for (let step = 0; step < 84; step += 1) {
          const progress = step / 83
          const band = getBand(step + arm * 9)
          const angle = arm * (Math.PI * 2 / 9) + progress * Math.PI * 7 + time * 0.26
          const currentRadius = radius * progress * (0.35 + band * 0.7 + energy * 0.3)
          points.push([centerX + Math.cos(angle) * currentRadius, centerY + Math.sin(angle) * currentRadius])
        }
        drawLine(points, arm * 38 + time * 18, 1.1, 0.78)
      }
    }

    const drawFan = (centerX: number, centerY: number, radius: number, time: number, energy: number) => {
      const rays = 96
      for (let ray = 0; ray < rays; ray += 1) {
        const angle = (ray / rays) * Math.PI * 2 + time * 0.14
        const band = getBand(ray * 2)
        const innerRadius = radius * (0.16 + Math.sin(time * 0.8 + ray * 0.3) * 0.05)
        const outerRadius = radius * (0.64 + band * 0.68 + energy * 0.24)
        drawLine([
          [centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius],
          [centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius],
        ], ray * 3.75 + time * 15, 1, 0.72)
      }
    }

    const drawSpirograph = (centerX: number, centerY: number, radius: number, time: number, energy: number) => {
      for (let layer = 0; layer < 12; layer += 1) {
        const points: [number, number][] = []
        const band = getBand(layer * 12)
        for (let step = 0; step <= 120; step += 1) {
          const angle = (step / 120) * Math.PI * 2
          const wobble = Math.sin(angle * (5 + layer % 4) + time * (0.8 + energy))
          const currentRadius = radius * (0.42 + layer * 0.035 + wobble * (0.12 + band * 0.16))
          points.push([
            centerX + Math.cos(angle + time * 0.12) * currentRadius,
            centerY + Math.sin(angle + time * 0.12) * currentRadius,
          ])
        }
        drawLine(points, layer * 29 + time * 12, 0.9, 0.66)
      }
    }

    const drawTunnel = (centerX: number, centerY: number, radius: number, time: number, energy: number) => {
      for (let ring = 0; ring < 26; ring += 1) {
        const depth = (ring / 26 + (time * (0.035 + energy * 0.022)) % 1) % 1
        const currentRadius = radius * (0.12 + depth * 1.18)
        const points: [number, number][] = []
        for (let side = 0; side <= 32; side += 1) {
          const angle = (side / 32) * Math.PI * 2 + time * 0.1
          const band = getBand(side * 3 + ring)
          const warp = 1 + Math.sin(angle * 4 + time + ring) * (0.08 + band * 0.18)
          points.push([centerX + Math.cos(angle) * currentRadius * warp, centerY + Math.sin(angle) * currentRadius * warp])
        }
        drawLine(points, ring * 13 + time * 16, 0.8, 0.55 + depth * 0.25)
      }
    }

    const startedAt = performance.now()
    const animate = (now: number) => {
      frameId = window.requestAnimationFrame(animate)
      if (now - lastFrame < 33) return
      lastFrame = now

      const time = (now - startedAt) / 1000
      const presetIndex = Math.floor(time / 20) % TURTLE_PRESETS.length
      if (presetIndex !== lastPreset) {
        lastPreset = presetIndex
        context.fillStyle = '#02070d'
        context.fillRect(0, 0, width, height)
      }

      if (analyser && isPlayingRef.current) analyser.getByteFrequencyData(data)
      else data.fill(0)

      let total = 0
      let bassTotal = 0
      for (let index = 0; index < data.length; index += 1) {
        total += data[index]
        if (index > 0 && index < 18) bassTotal += data[index]
      }
      const energy = data.length ? total / data.length / 255 : 0.04
      const bass = bassTotal / 17 / 255
      const beat = bass > 0.14 && bass > bassAverage * 1.3
      bassAverage = bassAverage * 0.88 + bass * 0.12
      beatPulse = Math.max(beatPulse * 0.86, beat ? 1 : 0)

      context.fillStyle = 'rgba(2, 7, 13, 0.2)'
      context.fillRect(0, 0, width, height)
      context.save()
      context.globalCompositeOperation = 'lighter'

      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) * (0.25 + beatPulse * 0.05)
      const preset = TURTLE_PRESETS[presetIndex]
      if (preset === 'weave') drawWeave(centerX, centerY, radius, time, energy)
      if (preset === 'petals') drawPetals(centerX, centerY, radius, time, energy)
      if (preset === 'spiral') drawSpiral(centerX, centerY, radius, time, energy)
      if (preset === 'fan') drawFan(centerX, centerY, radius, time, energy)
      if (preset === 'spirograph') drawSpirograph(centerX, centerY, radius, time, energy)
      if (preset === 'tunnel') drawTunnel(centerX, centerY, radius, time, energy)
      context.restore()
    }
    frameId = window.requestAnimationFrame(animate)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [analyser, trackId])

  return (
    <div className="audio-visualizer-3d" aria-hidden="true">
      <canvas ref={canvasRef} />
      {isUnavailable ? <span className="audio-visualizer-3d-fallback">Thiết bị này chưa hỗ trợ visual.</span> : null}
    </div>
  )
}
