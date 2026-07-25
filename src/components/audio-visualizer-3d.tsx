'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type AudioVisualizer3DProps = {
  analyser: AnalyserNode | null
  isPlaying: boolean
  trackId: string
}

const VISUAL_PRESETS = ['ring', 'ribbon', 'blob', 'tunnel'] as const

export function AudioVisualizer3D({ analyser, isPlaying, trackId }: Readonly<AudioVisualizer3DProps>) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const [isUnavailable, setIsUnavailable] = useState(false)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: THREE.WebGLRenderer | null = null
    let frameId = 0
    let resizeObserver: ResizeObserver | null = null
    setIsUnavailable(false)

    try {
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
      camera.position.set(0, 0, 7.6)

      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1 : 1.25))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.appendChild(renderer.domElement)

      const resize = () => {
        const { width, height } = host.getBoundingClientRect()
        if (!width || !height || !renderer) return
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
      }
      resize()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)

      const ringGroup = new THREE.Group()
      const ribbonGroup = new THREE.Group()
      const blobGroup = new THREE.Group()
      const tunnelGroup = new THREE.Group()
      scene.add(ringGroup, ribbonGroup, blobGroup, tunnelGroup)

      const barGeometry = new THREE.BoxGeometry(0.052, 0.22, 0.08)
      const barMaterials = ['#57e9ff', '#7867ff', '#ef38d7', '#ffd239'].map((color) => new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.7,
        metalness: 0.5,
        roughness: 0.18,
      }))
      const bars: THREE.Mesh[] = []
      for (let index = 0; index < 72; index += 1) {
        const angle = (index / 72) * Math.PI * 2
        const bar = new THREE.Mesh(barGeometry, barMaterials[index % barMaterials.length])
        bar.position.set(Math.cos(angle) * 2.52, Math.sin(angle) * 1.28, 0)
        bar.rotation.z = angle + Math.PI / 2
        ringGroup.add(bar)
        bars.push(bar)
      }
      ringGroup.rotation.x = 0.82

      const ribbonLines: { line: THREE.Line; positions: Float32Array; layer: number }[] = []
      for (let layer = 0; layer < 6; layer += 1) {
        const positions = new Float32Array(74 * 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const color = new THREE.Color().setHSL((layer * 0.12 + 0.48) % 1, 0.9, 0.64)
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.82 }))
        ribbonGroup.add(line)
        ribbonLines.push({ line, positions, layer })
      }
      ribbonGroup.rotation.x = 0.8

      const blobMaterial = new THREE.MeshStandardMaterial({
        color: '#4ce6ff',
        emissive: '#0d7096',
        emissiveIntensity: 1.5,
        metalness: 0.65,
        roughness: 0.2,
        wireframe: true,
        transparent: true,
        opacity: 0.92,
      })
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.72, 4), blobMaterial)
      const coreMaterial = new THREE.MeshBasicMaterial({ color: '#fb4ce8', transparent: true, opacity: 0.26 })
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.24, 3), coreMaterial)
      blobGroup.add(blob, core)

      const tunnelLines: THREE.LineLoop[] = []
      for (let index = 0; index < 22; index += 1) {
        const points = Array.from({ length: 32 }, (_, pointIndex) => {
          const angle = (pointIndex / 32) * Math.PI * 2
          return new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0)
        })
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const color = new THREE.Color().setHSL((index * 0.045 + 0.52) % 1, 0.86, 0.62)
        const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.58 }))
        line.position.z = -index * 0.58
        tunnelGroup.add(line)
        tunnelLines.push(line)
      }

      const particleGeometry = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(280 * 3)
      for (let index = 0; index < particlePositions.length; index += 3) {
        const radius = 2.8 + Math.random() * 3.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        particlePositions[index] = radius * Math.sin(phi) * Math.cos(theta)
        particlePositions[index + 1] = radius * Math.sin(phi) * Math.sin(theta)
        particlePositions[index + 2] = radius * Math.cos(phi) * 0.45
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      const particleMaterial = new THREE.PointsMaterial({ color: '#b9f7ff', size: 0.026, transparent: true, opacity: 0.7 })
      const particles = new THREE.Points(particleGeometry, particleMaterial)
      scene.add(particles)

      const keyLight = new THREE.PointLight('#55e9ff', 22, 22)
      keyLight.position.set(-3.5, 2.6, 4)
      const accentLight = new THREE.PointLight('#ff43d0', 18, 18)
      accentLight.position.set(3, -2, 3)
      scene.add(keyLight, accentLight, new THREE.AmbientLight('#6578a0', 1.2))

      const frequencyData = new Uint8Array(analyser?.frequencyBinCount ?? 256)
      const startedAt = performance.now()
      let activePreset = -1
      let bassAverage = 0
      let beatPulse = 0

      const animate = (now: number) => {
        frameId = window.requestAnimationFrame(animate)
        const elapsed = (now - startedAt) / 1000
        const presetIndex = Math.floor(elapsed / 22) % VISUAL_PRESETS.length
        const preset = VISUAL_PRESETS[presetIndex]

        if (activePreset !== presetIndex) {
          activePreset = presetIndex
          ringGroup.visible = preset === 'ring'
          ribbonGroup.visible = preset === 'ribbon'
          blobGroup.visible = preset === 'blob'
          tunnelGroup.visible = preset === 'tunnel'
        }

        if (analyser && isPlayingRef.current) analyser.getByteFrequencyData(frequencyData)
        else frequencyData.fill(0)

        let total = 0
        for (let index = 0; index < frequencyData.length; index += 1) total += frequencyData[index]
        const average = frequencyData.length ? total / frequencyData.length / 255 : 0
        const bassBins = Math.min(17, frequencyData.length - 1)
        let bassTotal = 0
        for (let index = 1; index <= bassBins; index += 1) bassTotal += frequencyData[index]
        const bass = bassBins > 0 ? bassTotal / bassBins / 255 : 0
        const idlePulse = isPlayingRef.current ? 0 : 0.045 + Math.sin(elapsed * 1.4) * 0.015
        const energy = average || idlePulse
        const isBeat = bass > 0.13 && bass > bassAverage * 1.28
        bassAverage = bassAverage * 0.88 + bass * 0.12
        beatPulse = Math.max(beatPulse * 0.88, isBeat ? 1 : 0)

        bars.forEach((bar, index) => {
          const bandIndex = Math.min(frequencyData.length - 1, Math.floor((index / bars.length) * frequencyData.length * 0.72))
          const level = frequencyData[bandIndex] / 255 || idlePulse
          const scale = 0.42 + level * 11 + beatPulse * 1.4
          bar.scale.y += (scale - bar.scale.y) * 0.3
        })
        ringGroup.rotation.z = elapsed * (0.1 + energy * 0.14)

        ribbonLines.forEach(({ line, positions, layer }) => {
          for (let pointIndex = 0; pointIndex < 74; pointIndex += 1) {
            const angle = (pointIndex / 73) * Math.PI * 2
            const bandIndex = Math.min(frequencyData.length - 1, (pointIndex * 2 + layer * 11) % frequencyData.length)
            const level = frequencyData[bandIndex] / 255 || idlePulse
            const radius = 1.18 + layer * 0.24 + level * 0.9 + beatPulse * 0.2
            const offset = Math.sin(angle * (2 + layer * 0.15) + elapsed * 1.4) * (0.1 + level * 0.48)
            positions[pointIndex * 3] = Math.cos(angle) * radius
            positions[pointIndex * 3 + 1] = Math.sin(angle) * radius
            positions[pointIndex * 3 + 2] = offset + (layer - 3.5) * 0.16
          }
          ;(line.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
        })
        ribbonGroup.rotation.z = -elapsed * 0.1

        blob.scale.setScalar(1 + energy * 0.42 + beatPulse * 0.16)
        core.scale.setScalar(0.9 + energy * 0.54 + beatPulse * 0.2)
        blob.rotation.x = elapsed * 0.18
        blob.rotation.y = elapsed * 0.26
        core.rotation.x = -elapsed * 0.14
        core.rotation.z = elapsed * 0.2
        blobMaterial.emissiveIntensity = 0.9 + energy * 2.8
        coreMaterial.opacity = 0.12 + energy * 0.45

        tunnelLines.forEach((line, index) => {
          const bandIndex = Math.min(frequencyData.length - 1, (index * 7) % frequencyData.length)
          const level = frequencyData[bandIndex] / 255 || idlePulse
          line.position.z += 0.025 + energy * 0.12 + beatPulse * 0.025
          if (line.position.z > 2.2) line.position.z = -12.8
          const scale = 0.55 + (1 - Math.abs(line.position.z) / 13) * 1.55 + level * 0.54 + beatPulse * 0.16
          line.scale.set(scale * (1 + Math.sin(elapsed + index) * 0.06), scale, 1)
          line.rotation.z += 0.004 + level * 0.025
        })

        particles.rotation.z = elapsed * 0.018
        particles.rotation.y = elapsed * 0.026
        keyLight.intensity = 10 + energy * 42
        accentLight.intensity = 7 + energy * 36
        renderer?.render(scene, camera)
      }
      frameId = window.requestAnimationFrame(animate)

      return () => {
        window.cancelAnimationFrame(frameId)
        resizeObserver?.disconnect()
        barGeometry.dispose()
        blob.geometry.dispose()
        core.geometry.dispose()
        particleGeometry.dispose()
        blobMaterial.dispose()
        coreMaterial.dispose()
        particleMaterial.dispose()
        barMaterials.forEach((material) => material.dispose())
        ribbonLines.forEach(({ line }) => {
          line.geometry.dispose()
          ;(line.material as THREE.Material).dispose()
        })
        tunnelLines.forEach((line) => {
          line.geometry.dispose()
          ;(line.material as THREE.Material).dispose()
        })
        renderer?.dispose()
        renderer?.domElement.remove()
      }
    } catch {
      setIsUnavailable(true)
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [analyser, trackId])

  return (
    <div className="audio-visualizer-3d" ref={hostRef} aria-hidden="true">
      {isUnavailable ? <span className="audio-visualizer-3d-fallback">Thiết bị này chưa hỗ trợ visual 3D.</span> : null}
    </div>
  )
}
