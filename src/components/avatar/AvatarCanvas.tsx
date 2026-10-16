import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ProceduralCharacter } from './ProceduralCharacter'
import type { BodyMorphParameters, CharacterMode, CharacterAppearance } from '@/types'
import { canUseWebGL } from '@/services/character/webgl'
import { RotateCcw, Eye, ShieldAlert, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AvatarCanvasProps {
  currentMorph: BodyMorphParameters
  goalMorph: BodyMorphParameters
  mode: CharacterMode
  onModeChange?: (mode: CharacterMode) => void
  auraEnabled?: boolean
  height?: string
  appearance?: CharacterAppearance
  label?: string
  comparisonMorph?: BodyMorphParameters
  comparisonLabel?: string
}
const fallback = <div role="status" className="h-full flex flex-col items-center justify-center text-center gap-3 p-8 text-slate-400"><ShieldAlert className="h-8 w-8 text-amber-400" /><p>Khung nhìn 3D chưa khả dụng trên trình duyệt này.</p><p className="text-xs">Số đo và lịch sử vẫn được lưu. Hãy thử bật tăng tốc đồ họa hoặc dùng trình duyệt hỗ trợ WebGL 2.</p></div>
class RendererBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? fallback : this.props.children }
}
function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree(state => state.gl)
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => gl.domElement.removeEventListener('webglcontextlost', lost)
  }, [gl, onLost])
  return null
}
export function AvatarCanvas({ currentMorph, goalMorph, mode, onModeChange, auraEnabled = false,
  height = 'clamp(360px, 65vh, 520px)', appearance, label, comparisonMorph, comparisonLabel }: AvatarCanvasProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [available] = useState(() => canUseWebGL())
  const [lost, setLost] = useState(false)
  const active = mode === 'goal' ? goalMorph : currentMorph
  const zoom = (factor: number) => {
    const controls = controlsRef.current
    if (!controls) return
    const offset = controls.object.position.clone().sub(controls.target)
    const distance = Math.max(2.8, Math.min(7, offset.length() * factor))
    controls.object.position.copy(controls.target).add(offset.normalize().multiplyScalar(distance))
    controls.update()
  }
  return <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
    <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-wrap gap-1">
        {onModeChange && <div className="inline-flex rounded-xl bg-slate-950/90 p-1 border border-slate-800">
          <Button size="sm" variant={mode === 'current' ? 'primary' : 'ghost'} onClick={() => onModeChange('current')}>Hiện tại</Button>
          <Button size="sm" variant={mode === 'goal' ? 'gold' : 'ghost'} onClick={() => onModeChange('goal')}>Mục tiêu · mô phỏng</Button>
        </div>}
      </div>
      <div className="pointer-events-auto bg-slate-950/90 p-1 rounded-xl border border-slate-800 flex gap-1">
        <Button size="icon" variant="ghost" aria-label="Bật/Tắt tự động xoay" aria-pressed={autoRotate} onClick={() => setAutoRotate(value => !value)}><Eye className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Phóng to" onClick={() => zoom(0.85)}><ZoomIn className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Thu nhỏ" onClick={() => zoom(1.15)}><ZoomOut className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" aria-label="Đặt lại góc camera" onClick={() => { controlsRef.current?.reset(); setAutoRotate(false) }}><RotateCcw className="h-4 w-4" /></Button>
      </div>
    </div>
    <div style={{ height }} className="w-full" role="img" aria-label={label ?? (mode === 'goal' ? 'Avatar mục tiêu mô phỏng' : 'Avatar hiện tại')}>
      {!available || lost ? fallback : <RendererBoundary><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.35, 4.8], fov: 45 }} gl={{ antialias: true, alpha: true }} fallback={fallback}>
        <ContextGuard onLost={() => setLost(true)} />
        <ambientLight intensity={1.2} /><directionalLight position={[3, 4, 4]} intensity={2.2} /><directionalLight position={[-3, 2, -2]} intensity={1.4} color="#93c5fd" />
        <Grid position={[0, -1.18, 0]} args={[12, 12]} cellSize={0.5} cellThickness={0.6} cellColor="#1e293b" sectionSize={2.5} sectionColor="#334155" fadeDistance={12} />
        {comparisonMorph ? <>
          <group position={[-0.64, -0.45, 0]} scale={0.58}><ProceduralCharacter morph={active} isGoalMode={mode === 'goal'} auraEnabled={auraEnabled} appearance={appearance} /></group>
          <group position={[0.64, -0.45, 0]} scale={0.58}><ProceduralCharacter morph={comparisonMorph} auraEnabled={false} appearance={appearance} /></group>
        </> : <ProceduralCharacter morph={active} isGoalMode={mode === 'goal'} auraEnabled={auraEnabled} appearance={appearance} />}
        <OrbitControls ref={controlsRef} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={1.2} minDistance={2.8} maxDistance={7} minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI * 0.76} target={[0, 0, 0]} />
      </Canvas></RendererBoundary>}
    </div>
    <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none space-y-1 text-center">
      <p className="text-xs text-teal-200 bg-slate-950/90 rounded-lg p-1">{label ?? (mode === 'goal' ? 'Mục tiêu · mô phỏng giả định' : 'Hiện tại · minh họa gần đúng')}{comparisonLabel && ` · Trái / phải: ${comparisonLabel}`}</p>
      <div className="flex justify-center gap-1.5 p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] text-slate-400"><ShieldAlert className="h-3 w-3 text-amber-400 shrink-0" /><span>Mô hình thủ tục 3D minh họa thể trạng RPG - Không phản ánh chính xác cấu trúc giải phẫu y khoa.</span></div>
    </div>
  </div>
}
