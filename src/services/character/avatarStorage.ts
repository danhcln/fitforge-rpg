import type { AvatarMorphConfiguration } from './avatarMorphTypes'

export const AVATAR_STORAGE_KEY = 'fitforge_avatar_morph_config_v1'
export const CURRENT_MODEL_NAME = 'gym_avatar_v3.glb'
export const CONFIG_SCHEMA_VERSION = '1.0.0'

class MemoryStorage implements Storage {
  private store: Record<string, string> = {}
  get length() { return Object.keys(this.store).length }
  clear() { this.store = {} }
  getItem(key: string) { return this.store[key] ?? null }
  key(index: number) { return Object.keys(this.store)[index] ?? null }
  removeItem(key: string) { delete this.store[key] }
  setItem(key: string, value: string) { this.store[key] = String(value) }
}

const memoryFallback = new MemoryStorage()

function getStorage(): Storage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // Access denied or not available
  }
  return memoryFallback
}

export function saveAvatarMorphConfig(morphs: Record<string, number>, notes?: string): boolean {
  try {
    const config: AvatarMorphConfiguration = {
      version: CONFIG_SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      modelFile: CURRENT_MODEL_NAME,
      morphs,
      notes,
    }
    getStorage().setItem(AVATAR_STORAGE_KEY, JSON.stringify(config))
    return true
  } catch (err) {
    console.error('Failed to save avatar morph configuration to localStorage:', err)
    return false
  }
}

export function loadAvatarMorphConfig(): Record<string, number> | null {
  try {
    const raw = getStorage().getItem(AVATAR_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AvatarMorphConfiguration>
    if (parsed && typeof parsed.morphs === 'object' && parsed.morphs !== null) {
      return sanitizeMorphsRecord(parsed.morphs)
    }
    return null
  } catch (err) {
    console.error('Failed to load avatar morph configuration from localStorage:', err)
    return null
  }
}

export function clearAvatarMorphConfig(): void {
  try {
    getStorage().removeItem(AVATAR_STORAGE_KEY)
  } catch (err) {
    console.error('Failed to remove avatar morph configuration from localStorage:', err)
  }
}

export function exportAvatarMorphJson(morphs: Record<string, number>, notes?: string): string {
  const config: AvatarMorphConfiguration = {
    version: CONFIG_SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    modelFile: CURRENT_MODEL_NAME,
    morphs: sanitizeMorphsRecord(morphs),
    notes: notes || 'Exported character customization configuration',
  }
  return JSON.stringify(config, null, 2)
}

export function validateAvatarMorphConfigJson(jsonString: string): {
  success: boolean
  data?: Record<string, number>
  error?: string
} {
  if (!jsonString || typeof jsonString !== 'string') {
    return { success: false, error: 'Dữ liệu JSON rỗng hoặc không đúng định dạng.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return { success: false, error: 'Cú pháp JSON không hợp lệ. Vui lòng kiểm tra lại định dạng tệp.' }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, error: 'Cấu trúc cấu hình phải là một đối tượng JSON hợp lệ.' }
  }

  const rawConfig = parsed as Record<string, unknown>
  let morphsCandidate: unknown = rawConfig.morphs

  // Support direct object format { [key: string]: number } as fallback
  if (!morphsCandidate && typeof rawConfig === 'object') {
    morphsCandidate = rawConfig
  }

  if (typeof morphsCandidate !== 'object' || morphsCandidate === null) {
    return { success: false, error: 'Không tìm thấy dữ liệu "morphs" hợp lệ trong cấu hình.' }
  }

  const cleanMorphs: Record<string, number> = {}
  for (const [key, val] of Object.entries(morphsCandidate as Record<string, unknown>)) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      cleanMorphs[key] = Math.max(0, Math.min(1, val))
    }
  }

  if (Object.keys(cleanMorphs).length === 0) {
    return { success: false, error: 'Không có giá trị morph target hợp lệ nào trong cấu hình.' }
  }

  return { success: true, data: cleanMorphs }
}

export function downloadAvatarMorphConfigFile(morphs: Record<string, number>, filename = 'avatar_character_preset.json'): void {
  const json = exportAvatarMorphJson(morphs)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sanitizeMorphsRecord(morphs: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [key, val] of Object.entries(morphs)) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      result[key] = Math.max(0, Math.min(1, val))
    }
  }
  return result
}
