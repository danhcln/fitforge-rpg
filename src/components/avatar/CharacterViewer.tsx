import { Component, Suspense, useRef, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import { AvatarModel } from './AvatarModel'
import { CameraControls, type CameraControlsHandle, type CameraPreset } from './CameraControls'
import type { MorphTargetInfo } from '@/services/character/avatarMorphTypes'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  RotateCcw,
  Eye,
  ZoomIn,
  ZoomOut,
  User,
  ShieldAlert,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react'

interface CharacterViewerProps {
  modelUrl?: string
  morphInfluences?: Record<string, number>
  onInspectTargets?: (targets: MorphTargetInfo[], meshName: string) => void
  height?: string
  showDefectNotice?: boolean
}

class ViewerErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: Error | null } = { hasError: false, error: null }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[380px] flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <ShieldAlert className="h-10 w-10 text-rose-400" />
          <h3 className="text-sm font-bold text-white">Không thể tải mô hình 3D Avatar</h3>
          <p className="text-xs text-rose-300 font-mono max-w-md">
            {this.state.error?.message || 'Lỗi khi khởi tạo ngữ cảnh WebGL hoặc phân tích tệp GLB.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs"
          >
            Thử tải lại khung nhìn
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

function ModelLoadingFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 backdrop-blur-sm z-20 text-slate-300">
      <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-white">Đang tải mô hình 3D Gym Avatar...</p>
        <p className="text-xs text-slate-400">Đang chuẩn bị lưới đa giác và giải mã morph targets MPFB</p>
      </div>
    </div>
  )
}

export function CharacterViewer({
  modelUrl = '/models/gym_avatar_v3.glb',
  morphInfluences = {},
  onInspectTargets,
  height = 'clamp(420px, 68vh, 560px)',
  showDefectNotice = true,
}: CharacterViewerProps) {
  const cameraRef = useRef<CameraControlsHandle>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [activePreset, setActivePreset] = useState<CameraPreset | null>('full-body')
  const [showNotice, setShowNotice] = useState(showDefectNotice)

  const handlePresetClick = (preset: CameraPreset) => {
    setActivePreset(preset)
    cameraRef.current?.setPreset(preset)
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Preset Selector */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md shadow-lg">
          <Button
            size="sm"
            variant={activePreset === 'full-body' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2.5 rounded-lg"
            onClick={() => handlePresetClick('full-body')}
          >
            Toàn thân
          </Button>
          <Button
            size="sm"
            variant={activePreset === 'upper-body' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2.5 rounded-lg"
            onClick={() => handlePresetClick('upper-body')}
          >
            Thân trên
          </Button>
          <Button
            size="sm"
            variant={activePreset === 'face' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2.5 rounded-lg"
            onClick={() => handlePresetClick('face')}
          >
            Khuôn mặt
          </Button>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <Button
            size="sm"
            variant={activePreset === 'front' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2 rounded-lg"
            onClick={() => handlePresetClick('front')}
          >
            Trước
          </Button>
          <Button
            size="sm"
            variant={activePreset === 'back' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2 rounded-lg"
            onClick={() => handlePresetClick('back')}
          >
            Sau
          </Button>
          <Button
            size="sm"
            variant={activePreset === 'side-left' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2 rounded-lg"
            onClick={() => handlePresetClick('side-left')}
          >
            Trái
          </Button>
          <Button
            size="sm"
            variant={activePreset === 'side-right' ? 'primary' : 'ghost'}
            className="text-xs h-7 px-2 rounded-lg"
            onClick={() => handlePresetClick('side-right')}
          >
            Phải
          </Button>
        </div>

        {/* View Tools */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-md shadow-lg">
          <Button
            size="icon"
            variant={autoRotate ? 'primary' : 'ghost'}
            className="h-7 w-7 rounded-lg"
            aria-label="Tự động xoay 360 độ"
            aria-pressed={autoRotate}
            onClick={() => setAutoRotate((prev) => !prev)}
            title="Tự động xoay 360 độ"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg"
            aria-label="Phóng to"
            onClick={() => cameraRef.current?.zoomIn()}
            title="Phóng to"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg"
            aria-label="Thu nhỏ"
            onClick={() => cameraRef.current?.zoomOut()}
            title="Thu nhỏ"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-lg"
            aria-label="Đặt lại góc camera"
            onClick={() => handlePresetClick('reset')}
            title="Đặt lại góc nhìn mặc định"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ height }} className="w-full relative">
        <ViewerErrorBoundary>
          <Suspense fallback={<ModelLoadingFallback />}>
            <Canvas
              dpr={[1, 2]}
              camera={{ position: [0, 0.85, 2.6], fov: 42 }}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              shadows
            >
              {/* Studio Lights */}
              <ambientLight intensity={0.9} />
              <directionalLight
                position={[3, 4, 3.5]}
                intensity={2.2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.0001}
              />
              <directionalLight position={[-3, 2, 2]} intensity={1.1} color="#93c5fd" />
              <directionalLight position={[0, 3, -3]} intensity={1.4} color="#fef08a" />

              {/* Gym Podium Grid Platform */}
              <group position={[0, 0, 0]}>
                {/* Platform Disc */}
                <mesh position={[0, -0.04, 0]} receiveShadow>
                  <cylinderGeometry args={[1.05, 1.15, 0.08, 48]} />
                  <meshStandardMaterial color="#090d16" roughness={0.7} metalness={0.4} />
                </mesh>
                {/* Neon Accent Ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
                  <ringGeometry args={[0.98, 1.04, 48]} />
                  <meshBasicMaterial color="#14b8a6" />
                </mesh>
                {/* Studio Grid */}
                <Grid
                  position={[0, 0.001, 0]}
                  args={[6, 6]}
                  cellSize={0.25}
                  cellThickness={0.5}
                  cellColor="#1e293b"
                  sectionSize={1.0}
                  sectionThickness={1.0}
                  sectionColor="#334155"
                  fadeDistance={6}
                />
              </group>

              {/* 3D Gym Avatar Model */}
              <AvatarModel
                modelUrl={modelUrl}
                morphInfluences={morphInfluences}
                onInspectTargets={onInspectTargets}
              />

              {/* Orbit & Camera Controls */}
              <CameraControls
                ref={cameraRef}
                autoRotate={autoRotate}
                autoRotateSpeed={1.2}
              />
            </Canvas>
          </Suspense>
        </ViewerErrorBoundary>
      </div>

      {/* Bottom Floating Info / Notice */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 pointer-events-none space-y-1.5 text-center">
        {showNotice && (
          <div className="pointer-events-auto mx-auto max-w-xl flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-900/60 text-[11px] text-amber-200 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-left">
              <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Ghi chú tệp GLB:</strong> Mô hình MPFB hiện tại xuất hiện phần lưới tóc/váy bất thường do cài đặt xuất Blender. Tệp được giữ nguyên bản và sẵn sàng thay thế phiên bản sau.
              </span>
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="text-amber-400 hover:text-white font-bold px-1"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="cyan" className="text-[10px] pointer-events-auto">
            <User className="h-3 w-3 mr-1" />
            3D Gym Avatar MPFB (V3)
          </Badge>
          <Badge variant="outline" className="text-[10px] text-teal-300 border-teal-800 pointer-events-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Xoay 360° · Thu phóng tự do
          </Badge>
        </div>
      </div>
    </div>
  )
}
