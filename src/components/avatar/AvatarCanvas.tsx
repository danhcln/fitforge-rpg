import React, { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { ProceduralCharacter } from './ProceduralCharacter'
import type { BodyMorphParameters, CharacterMode } from '@/types'
import { RotateCcw, Eye, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface AvatarCanvasProps {
  currentMorph: BodyMorphParameters
  goalMorph: BodyMorphParameters
  mode: CharacterMode
  onModeChange?: (mode: CharacterMode) => void
  auraEnabled?: boolean
  height?: string
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  currentMorph,
  goalMorph,
  mode,
  onModeChange,
  auraEnabled = true,
  height = '500px',
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [autoRotate, setAutoRotate] = useState(false)

  const activeMorph = mode === 'goal' ? goalMorph : currentMorph
  const isGoal = mode === 'goal'

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl">
      {/* Top Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onModeChange && (
            <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 backdrop-blur-md shadow-lg">
              <button
                type="button"
                onClick={() => onModeChange('current')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isGoal
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hiện Tại (InBody)
              </button>
              <button
                type="button"
                onClick={() => onModeChange('goal')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isGoal
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mục Tiêu Thể Hình
              </button>
            </div>
          )}

          <Badge variant={isGoal ? 'gold' : 'cyan'} size="sm">
            <Sparkles className="w-3 h-3" />
            {isGoal ? 'Goal Projection' : 'Current Avatar'}
          </Badge>
        </div>

        {/* Viewport Control Tools */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-950/80 p-1 rounded-xl border border-slate-800 backdrop-blur-md">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-300"
            onClick={() => setAutoRotate(!autoRotate)}
            title="Bật/Tắt tự động xoay"
          >
            <Eye className={`w-3.5 h-3.5 ${autoRotate ? 'text-teal-400' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-300"
            onClick={handleResetCamera}
            title="Đặt lại góc camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div style={{ height }} className="w-full">
        <Canvas
          camera={{ position: [0, 0.8, 3.4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lights */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-3, 2, -2]} intensity={0.6} color={isGoal ? '#f59e0b' : '#06b6d4'} />
          <pointLight position={[0, -0.5, 2]} intensity={0.4} color="#14b8a6" />

          {/* Floor grid */}
          <Grid
            renderOrder={-1}
            position={[0, -1.15, 0]}
            infiniteGrid
            cellSize={0.5}
            cellThickness={0.6}
            cellColor="#1e293b"
            sectionSize={2.5}
            sectionThickness={1.2}
            sectionColor="#334155"
            fadeDistance={15}
          />

          {/* Character */}
          <ProceduralCharacter
            morph={activeMorph}
            isGoalMode={isGoal}
            auraEnabled={auraEnabled}
          />

          {/* Camera controls */}
          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={1.5}
            minDistance={1.8}
            maxDistance={5.5}
            maxPolarAngle={Math.PI / 2 + 0.05}
            minPolarAngle={Math.PI / 6}
            target={[0, 0.1, 0]}
          />
        </Canvas>
      </div>

      {/* Bottom Medical / Accuracy Disclaimer */}
      <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none">
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/85 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-sm mx-auto max-w-xl text-center">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Mô hình thủ tục 3D minh họa thể trạng RPG - Không phản ánh chính xác cấu trúc giải phẫu y khoa.
          </span>
        </div>
      </div>
    </div>
  )
}
