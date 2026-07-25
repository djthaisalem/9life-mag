'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type AudioVisualizer3DProps = {
  analyser: AnalyserNode | null
  isPlaying: boolean
}

export function AudioVisualizer3D({ analyser, isPlaying }: Readonly<AudioVisualizer3DProps>) {
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

    try {
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
      camera.position.set(0, 0.1, 7.4)

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7))
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

      const visualGroup = new THREE.Group()
      scene.add(visualGroup)

      const blobMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#5ae7ff'),
        emissive: new THREE.Color('#0a4a62'),
        emissiveIntensity: 1.25,
        metalness: 0.56,
        roughness: 0.26,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      })
      const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.62, 4), blobMaterial)
      visualGroup.add(blob)

      const coreMaterial = new THREE.MeshBasicMaterial({ color: '#ffbd31', transparent: true, opacity: 0.22 })
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.22, 3), coreMaterial)
      visualGroup.add(core)

      const bars = new THREE.Group()
      const barGeometry = new THREE.BoxGeometry(0.055, 0.22, 0.08)
      const barMaterials = ['#58e8ff', '#f7cf55', '#ff716f'].map((color) => new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.5,
        metalness: 0.45,
        roughness: 0.22,
      }))
      const barMeshes: THREE.Mesh[] = []
      const barCount = 84
      for (let index = 0; index < barCount; index += 1) {
        const angle = (index / barCount) * Math.PI * 2
        const bar = new THREE.Mesh(barGeometry, barMaterials[index % barMaterials.length])
        bar.position.set(Math.cos(angle) * 2.45, Math.sin(angle) * 2.45, 0)
        bar.rotation.z = angle + Math.PI / 2
        bars.add(bar)
        barMeshes.push(bar)
      }
      visualGroup.add(bars)

      const particleGeometry = new THREE.BufferGeometry()
      const particlePositions = new Float32Array(560 * 3)
      for (let index = 0; index < particlePositions.length; index += 3) {
        const radius = 2.8 + Math.random() * 3.5
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        particlePositions[index] = radius * Math.sin(phi) * Math.cos(theta)
        particlePositions[index + 1] = radius * Math.sin(phi) * Math.sin(theta)
        particlePositions[index + 2] = radius * Math.cos(phi) * 0.45
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#a9f4ff', size: 0.026, transparent: true, opacity: 0.74 }))
      scene.add(particles)

      const keyLight = new THREE.PointLight('#58e8ff', 26, 22)
      keyLight.position.set(-3, 2, 4)
      scene.add(keyLight)
      const accentLight = new THREE.PointLight('#ffb800', 20, 18)
      accentLight.position.set(3, -2, 3)
      scene.add(accentLight)
      scene.add(new THREE.AmbientLight('#5b7094', 1.3))

      const frequencyData = new Uint8Array(analyser?.frequencyBinCount ?? 256)
      const startedAt = performance.now()

      const animate = (now: number) => {
        frameId = window.requestAnimationFrame(animate)
        const elapsed = (now - startedAt) / 1000

        if (analyser && isPlayingRef.current) analyser.getByteFrequencyData(frequencyData)
        else frequencyData.fill(0)

        let total = 0
        for (let index = 0; index < frequencyData.length; index += 1) total += frequencyData[index]
        const average = frequencyData.length ? total / frequencyData.length / 255 : 0
        const idlePulse = isPlaying ? 0 : 0.045 + Math.sin(elapsed * 1.8) * 0.014
        const energy = average || idlePulse

        blob.scale.setScalar(1 + energy * 0.42)
        core.scale.setScalar(0.92 + energy * 0.58)
        blob.rotation.x = elapsed * 0.16
        blob.rotation.y = elapsed * 0.24
        core.rotation.x = -elapsed * 0.11
        core.rotation.z = elapsed * 0.18
        blobMaterial.emissiveIntensity = 0.8 + energy * 2.5
        coreMaterial.opacity = 0.16 + energy * 0.4

        barMeshes.forEach((bar, index) => {
          const bandIndex = Math.min(frequencyData.length - 1, Math.floor((index / barMeshes.length) * frequencyData.length * 0.72))
          const band = frequencyData[bandIndex] / 255
          const scale = 0.4 + (band || idlePulse) * 10
          bar.scale.y += (scale - bar.scale.y) * 0.22
        })
        bars.rotation.z = -elapsed * (0.09 + energy * 0.17)
        particles.rotation.z = elapsed * 0.018
        particles.rotation.y = elapsed * 0.028
        keyLight.intensity = 10 + energy * 40
        accentLight.intensity = 8 + energy * 34

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
        barMaterials.forEach((material) => material.dispose())
        ;(particles.material as THREE.Material).dispose()
        renderer?.dispose()
        renderer?.domElement.remove()
      }
    } catch {
      setIsUnavailable(true)
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [analyser])

  return (
    <div className="audio-visualizer-3d" ref={hostRef} aria-hidden="true">
      {isUnavailable ? <span className="audio-visualizer-3d-fallback">Thiết bị này chưa hỗ trợ visual 3D.</span> : null}
    </div>
  )
}
