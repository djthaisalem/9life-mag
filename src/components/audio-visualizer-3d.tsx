'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type AudioVisualizerProps = {
  analyser: AnalyserNode | null
  isPlaying: boolean
  trackId: string
}

type Preset = {
  group: THREE.Group
  animate: (time: number, energy: number, bass: number, beat: number) => void
}

const PRESET_DURATION_SECONDS = 10
const VARIANTS_PER_PRESET = 5

function hueColor(hue: number) {
  return new THREE.Color().setHSL((hue % 360) / 360, 0.92, 0.66)
}

function addLine(group: THREE.Group, points: THREE.Vector3[], hue: number, opacity = 0.78, loop = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: hueColor(hue), transparent: true, opacity })
  material.userData.baseHue = hue
  group.add(loop ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material))
}

function applyVariant(group: THREE.Group, variant: number) {
  group.traverse((item) => {
    const material = (item as THREE.Line).material
    if (!material || Array.isArray(material) || !(material instanceof THREE.LineBasicMaterial)) return
    const baseHue = typeof material.userData.baseHue === 'number' ? material.userData.baseHue : 190
    material.color.copy(hueColor(baseHue + variant * 68))
    material.opacity = 0.48 + variant * 0.075
  })
}

function createWeavePreset() {
  const group = new THREE.Group()
  for (let layer = 0; layer < 28; layer += 1) {
    const angle = (layer / 28) * Math.PI * 2
    const size = 2.2
    const points = [0, 1, 2, 3, 0].map((corner) => {
      const cornerAngle = angle + Math.PI / 4 + corner * Math.PI / 2
      return new THREE.Vector3(Math.cos(cornerAngle) * size, Math.sin(cornerAngle) * size, (layer - 14) * 0.035)
    })
    addLine(group, points, layer * 13, 0.62)
  }
  return { group, animate: (time, energy, bass) => {
    group.rotation.z = time * 0.36
    group.rotation.x = 0.58 + Math.sin(time * 0.42) * 0.15
    group.scale.setScalar(1 + energy * 0.25 + bass * 0.14)
  } } satisfies Preset
}

function createPetalPreset() {
  const group = new THREE.Group()
  for (let petal = 0; petal < 18; petal += 1) {
    const points: THREE.Vector3[] = []
    for (let step = 0; step <= 72; step += 1) {
      const progress = step / 72
      const angle = petal * (Math.PI * 2 / 18) + progress * Math.PI * 2
      const radius = 0.48 + Math.sin(progress * Math.PI) * 1.96
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(progress * Math.PI) * 0.34))
    }
    addLine(group, points, petal * 20, 0.68)
  }
  return { group, animate: (time, energy, bass, beat) => {
    group.rotation.z = -time * 0.44
    group.rotation.x = Math.sin(time * 0.3) * 0.22
    group.scale.setScalar(1 + energy * 0.3 + beat * 0.16 + bass * 0.18)
  } } satisfies Preset
}

function createSpiralPreset() {
  const group = new THREE.Group()
  for (let arm = 0; arm < 10; arm += 1) {
    const points: THREE.Vector3[] = []
    for (let step = 0; step < 112; step += 1) {
      const progress = step / 111
      const angle = arm * (Math.PI * 2 / 10) + progress * Math.PI * 6.5
      const radius = progress * 2.5
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, (progress - 0.5) * 1.15))
    }
    addLine(group, points, arm * 34, 0.78)
  }
  return { group, animate: (time, energy, bass) => {
    group.rotation.z = time * 0.52
    group.rotation.y = time * 0.18
    group.scale.setScalar(1 + energy * 0.3 + bass * 0.22)
  } } satisfies Preset
}

function createFanPreset() {
  const group = new THREE.Group()
  const segments: THREE.Vector3[] = []
  for (let ray = 0; ray < 112; ray += 1) {
    const angle = ray * (Math.PI * 2 / 112)
    segments.push(new THREE.Vector3(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0))
    segments.push(new THREE.Vector3(Math.cos(angle) * 2.72, Math.sin(angle) * 2.72, Math.sin(ray * 0.35) * 0.32))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(segments)
  const material = new THREE.LineBasicMaterial({ color: '#56e9ff', transparent: true, opacity: 0.76 })
  material.userData.baseHue = 190
  group.add(new THREE.LineSegments(geometry, material))
  return { group, animate: (time, energy, bass, beat) => {
    group.rotation.z = time * 0.64
    group.rotation.x = 0.68 + Math.sin(time * 0.5) * 0.18
    group.scale.set(1 + bass * 0.45 + beat * 0.12, 1 + energy * 0.26, 1)
  } } satisfies Preset
}

function createSpirographPreset() {
  const group = new THREE.Group()
  for (let line = 0; line < 11; line += 1) {
    const points: THREE.Vector3[] = []
    for (let step = 0; step <= 180; step += 1) {
      const angle = (step / 180) * Math.PI * 2
      const radius = 1.4 + Math.sin(angle * (4 + line % 4)) * 0.74
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.cos(angle * 3 + line) * 0.36))
    }
    addLine(group, points, line * 29, 0.65, true)
  }
  return { group, animate: (time, energy, bass) => {
    group.rotation.z = -time * 0.38
    group.rotation.x = time * 0.16
    group.scale.setScalar(1 + energy * 0.25 + bass * 0.18)
  } } satisfies Preset
}

function createTunnelPreset() {
  const group = new THREE.Group()
  for (let ring = 0; ring < 25; ring += 1) {
    const points: THREE.Vector3[] = []
    for (let point = 0; point < 40; point += 1) {
      const angle = point * (Math.PI * 2 / 40)
      const radius = 1.45 + Math.sin(angle * 4 + ring) * 0.16
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -ring * 0.52))
    }
    addLine(group, points, ring * 15, 0.56, true)
  }
  return { group, animate: (time, energy, bass) => {
    group.rotation.z = time * 0.24
    group.position.z = ((time * (1.35 + energy) % 0.52) - 0.52)
    group.scale.setScalar(1 + bass * 0.2)
  } } satisfies Preset
}

function createHelixPreset() {
  const group = new THREE.Group()
  for (let helix = 0; helix < 9; helix += 1) {
    const points: THREE.Vector3[] = []
    for (let step = 0; step <= 120; step += 1) {
      const progress = step / 120
      const angle = progress * Math.PI * 8 + helix * (Math.PI * 2 / 9)
      const radius = 1.55 + helix * 0.1
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, (progress - 0.5) * 4.8))
    }
    addLine(group, points, helix * 37, 0.66)
  }
  return { group, animate: (time, energy, bass, beat) => {
    group.rotation.z = time * 0.58
    group.rotation.x = time * 0.22
    group.scale.setScalar(0.94 + energy * 0.22 + bass * 0.12 + beat * 0.1)
  } } satisfies Preset
}

function createOrbitMeshPreset() {
  const group = new THREE.Group()
  for (let orbit = 0; orbit < 16; orbit += 1) {
    const points: THREE.Vector3[] = []
    const tilt = (orbit / 16) * Math.PI
    for (let step = 0; step <= 80; step += 1) {
      const angle = step * (Math.PI * 2 / 80)
      const x = Math.cos(angle) * 2.25
      const y = Math.sin(angle) * 1.18
      points.push(new THREE.Vector3(x, y * Math.cos(tilt), y * Math.sin(tilt)))
    }
    addLine(group, points, orbit * 22, 0.54, true)
  }
  return { group, animate: (time, energy, bass) => {
    group.rotation.y = time * 0.46
    group.rotation.x = time * 0.28
    group.scale.setScalar(1 + energy * 0.22 + bass * 0.2)
  } } satisfies Preset
}

function createLatticeSpherePreset() {
  const group = new THREE.Group()
  for (let latitude = -7; latitude <= 7; latitude += 1) {
    const points: THREE.Vector3[] = []
    const phi = latitude * Math.PI / 16
    for (let step = 0; step <= 72; step += 1) {
      const angle = step * (Math.PI * 2 / 72)
      points.push(new THREE.Vector3(Math.cos(phi) * Math.cos(angle) * 2.3, Math.sin(phi) * 2.3, Math.cos(phi) * Math.sin(angle) * 2.3))
    }
    addLine(group, points, (latitude + 7) * 24, 0.52, true)
  }
  for (let longitude = 0; longitude < 12; longitude += 1) {
    const points: THREE.Vector3[] = []
    const theta = longitude * Math.PI / 12
    for (let step = 0; step <= 48; step += 1) {
      const phi = -Math.PI / 2 + step * Math.PI / 48
      points.push(new THREE.Vector3(Math.cos(phi) * Math.cos(theta) * 2.3, Math.sin(phi) * 2.3, Math.cos(phi) * Math.sin(theta) * 2.3))
    }
    addLine(group, points, longitude * 30 + 170, 0.48)
  }
  return { group, animate: (time, energy, bass, beat) => {
    group.rotation.y = time * 0.42
    group.rotation.z = time * 0.18
    group.scale.setScalar(1 + energy * 0.2 + bass * 0.17 + beat * 0.12)
  } } satisfies Preset
}

function createBloomPreset() {
  const group = new THREE.Group()
  for (let arm = 0; arm < 28; arm += 1) {
    const points: THREE.Vector3[] = []
    for (let step = 0; step <= 44; step += 1) {
      const progress = step / 44
      const angle = arm * (Math.PI * 2 / 28) + progress * Math.PI * 0.72
      const radius = 0.28 + progress * 2.65
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(progress * Math.PI) * 0.7))
    }
    addLine(group, points, arm * 13, 0.72)
  }
  return { group, animate: (time, energy, bass, beat) => {
    group.rotation.z = -time * 0.7
    group.rotation.x = Math.sin(time * 0.28) * 0.36
    group.scale.setScalar(1 + energy * 0.28 + bass * 0.18 + beat * 0.2)
  } } satisfies Preset
}

export function AudioVisualizer3D({ analyser, isPlaying, trackId }: Readonly<AudioVisualizerProps>) {
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
    let lastFrame = 0
    let resizeObserver: ResizeObserver | null = null
    setIsUnavailable(false)

    try {
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100)
      camera.position.set(0, 0, 8)
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(1)
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

      const presets = [
        createWeavePreset(), createPetalPreset(), createSpiralPreset(), createFanPreset(), createSpirographPreset(),
        createTunnelPreset(), createHelixPreset(), createOrbitMeshPreset(), createLatticeSpherePreset(), createBloomPreset(),
      ]
      presets.forEach(({ group }) => scene.add(group))

      const stars = new THREE.Points(
        new THREE.BufferGeometry().setFromPoints(Array.from({ length: 120 }, () => new THREE.Vector3((Math.random() - 0.5) * 11, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4))),
        new THREE.PointsMaterial({ color: '#87efff', size: 0.028, transparent: true, opacity: 0.62 })
      )
      scene.add(stars, new THREE.AmbientLight('#6c80a8', 1.2))

      const data = new Uint8Array(analyser?.frequencyBinCount ?? 256)
      const startedAt = performance.now()
      let activePreset = -1
      let bassAverage = 0
      let beatPulse = 0

      const animate = (now: number) => {
        frameId = window.requestAnimationFrame(animate)
        if (now - lastFrame < 33) return
        lastFrame = now
        const time = ((now - startedAt) / 1000) * 4
        const sceneIndex = Math.floor(time / PRESET_DURATION_SECONDS) % (presets.length * VARIANTS_PER_PRESET)
        const presetIndex = sceneIndex % presets.length
        const variant = Math.floor(sceneIndex / presets.length)
        if (activePreset !== sceneIndex) {
          activePreset = sceneIndex
          presets.forEach(({ group }, index) => { group.visible = index === presetIndex })
          applyVariant(presets[presetIndex].group, variant)
        }

        if (analyser && isPlayingRef.current) analyser.getByteFrequencyData(data)
        else data.fill(0)
        let total = 0
        let bassTotal = 0
        for (let index = 0; index < data.length; index += 1) {
          total += data[index]
          if (index > 0 && index < 18) bassTotal += data[index]
        }
        const energy = data.length ? total / data.length / 255 : 0.03
        const bass = bassTotal / 17 / 255
        const beat = bass > 0.14 && bass > bassAverage * 1.28
        bassAverage = bassAverage * 0.88 + bass * 0.12
        beatPulse = Math.max(beatPulse * 0.84, beat ? 1 : 0)

        presets[presetIndex].animate(time, energy, bass, beatPulse)
        const activeGroup = presets[presetIndex].group
        const direction = variant % 2 === 0 ? 1 : -1
        activeGroup.rotation.y += direction * (0.0015 + variant * 0.0006)
        activeGroup.position.x = Math.sin(time * (0.16 + variant * 0.025)) * variant * 0.055
        activeGroup.position.y = Math.cos(time * (0.12 + variant * 0.02)) * variant * 0.035
        camera.position.z = 7.4 + variant * 0.16 + Math.sin(time * 0.3) * (0.22 + bass * 0.45)
        stars.rotation.z = time * 0.012
        stars.rotation.y = time * 0.019
        renderer?.render(scene, camera)
      }
      frameId = window.requestAnimationFrame(animate)

      return () => {
        window.cancelAnimationFrame(frameId)
        resizeObserver?.disconnect()
        presets.forEach(({ group }) => group.traverse((item) => {
          const line = item as THREE.Line
          line.geometry?.dispose()
          const material = line.material
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
          else material?.dispose()
        }))
        stars.geometry.dispose()
        ;(stars.material as THREE.Material).dispose()
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
