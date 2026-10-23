import { Component, Suspense, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { Eye, Pause, Play, RotateCcw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react'
import type { BodyMorphParameters, CharacterAppearance } from '@/types'
import { athleteInfluences } from '@/services/character/athlete'
import { canUseWebGL } from '@/services/character/webgl'
import { AthleteModel } from './AthleteModel'
import { CameraControls, type CameraControlsHandle, type CameraPreset } from './CameraControls'
import { Button } from '@/components/ui'

const unavailable = <div role="status" className="flex h-full min-h-96 flex-col justify-center items-center p-8 text-center text-slate-400"><p>Khung nhìn 3D chưa khả dụng.</p><p className="text-xs mt-2">Bạn vẫn có thể xem số đo và ghi lại buổi tập. Hãy dùng trình duyệt hỗ trợ WebGL 2.</p></div>
class AthleteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? unavailable : this.props.children }
}

export function AthleteViewer({ morph, appearance, comparisonMorph, label = 'Nhân vật của bạn', compact = false }:
  { morph: BodyMorphParameters; appearance: CharacterAppearance; comparisonMorph?: BodyMorphParameters; label?: string; compact?: boolean }) {
  const camera = useRef<CameraControlsHandle>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [motion, setMotion] = useState(() => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [celebration, setCelebration] = useState(0)
  const [available] = useState(canUseWebGL)
  const [contextLost, setContextLost] = useState(false)
  const [view, setView] = useState<CameraPreset>('full-body')
  const go = (preset: CameraPreset) => { setView(preset); camera.current?.setPreset(preset) }
  return <section className="overflow-hidden rounded-2xl border border-teal-900/50 bg-slate-950">
    {!compact && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 p-3">
      <div className="flex flex-wrap gap-1">{([['full-body', 'Toàn thân'], ['face', 'Gương mặt'], ['back', 'Sau'], ['side-left', 'Bên']] as const).map(([key, text]) =>
        <Button key={key} size="sm" variant={view === key ? 'primary' : 'ghost'} onClick={() => go(key)}>{text}</Button>)}</div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" aria-label="Tự động xoay" aria-pressed={autoRotate} onClick={() => setAutoRotate(!autoRotate)}><Eye className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Phóng to" onClick={() => camera.current?.zoomIn()}><ZoomIn className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Thu nhỏ" onClick={() => camera.current?.zoomOut()}><ZoomOut className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Đặt lại góc nhìn" onClick={() => { go('full-body'); setAutoRotate(false) }}><RotateCcw className="w-4 h-4" /></Button>
      </div>
    </div>}
    <div className="relative bg-[radial-gradient(ellipse_at_50%_35%,#173e49_0%,#0e202e_40%,#070d18_80%)]" style={{ height: compact ? 380 : 'clamp(440px, 65vh, 620px)' }}>
      <div className="absolute top-5 left-5 z-10 pointer-events-none"><p className="text-[10px] font-bold tracking-[.24em] text-teal-300/80">FITFORGE / ATHLETE 01</p><p className="mt-1 text-xs text-slate-400">{comparisonMorph ? 'Hai mốc đo · cùng một hành trình' : 'Mỗi buổi tập, một bước tiến.'}</p></div>
      {!available || contextLost ? unavailable : <AthleteBoundary><Suspense fallback={<div className="h-full flex items-center justify-center text-teal-300 text-sm">Đang chuẩn bị nhân vật…</div>}>
        <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, .95, 3.3], fov: 42 }} gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); setContextLost(true) }, { once: true })}>
          <ambientLight intensity={.8} />
          <hemisphereLight args={['#d7f6ff', '#283340', 1.3]} />
          <directionalLight position={[3, 4, 4]} intensity={2.8} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-.0002} />
          <directionalLight position={[-3, 2, 2]} intensity={1.2} color="#b4ddff" />
          <directionalLight position={[1, 3, -3]} intensity={2} color="#63dacb" />
          <mesh position={[0, -.04, 0]} receiveShadow><cylinderGeometry args={[.73, .77, .08, 64]} /><meshStandardMaterial color="#172d39" roughness={.8} /></mesh>
          <mesh position={[0, .001, 0]} rotation={[-Math.PI/2, 0, 0]}><ringGeometry args={[.68, .695, 64]} /><meshBasicMaterial color={appearance.accentColor} /></mesh>
          <ContactShadows position={[0, .003, 0]} opacity={.5} scale={4} blur={2.5} far={2.5} resolution={256} />
          {comparisonMorph ? <>
            <group position={[-.43, 0, 0]} scale={.67}><AthleteModel morphInfluences={athleteInfluences(morph)} appearance={appearance} motionEnabled={motion} /></group>
            <group position={[.43, 0, 0]} scale={.67}><AthleteModel morphInfluences={athleteInfluences(comparisonMorph)} appearance={appearance} motionEnabled={motion} /></group>
          </> : <AthleteModel morphInfluences={athleteInfluences(morph)} appearance={appearance} motionEnabled={motion} celebration={celebration} />}
          <CameraControls ref={camera} autoRotate={autoRotate} />
        </Canvas>
      </Suspense></AthleteBoundary>}
    </div>
    <div className="border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-slate-400">{label}</p>
      {!compact && <div className="flex gap-2">
        <Button size="sm" variant="ghost" aria-pressed={motion} onClick={() => setMotion(!motion)}>{motion ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}{motion ? 'Dừng chuyển động' : 'Bật chuyển động'}</Button>
        <Button size="sm" variant="outline" disabled={!motion || !!comparisonMorph} onClick={() => setCelebration(n => n + 1)}><Sparkles className="w-3 h-3 mr-1" />Ăn mừng</Button>
      </div>}
    </div>
  </section>
}
