import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuestStore, useUserStore, useCharacterStore } from '@/stores'
import { db } from '@/services/db'
import { Card, CardHeader, CardContent, CardTitle, Badge, Button, Progress } from '@/components/ui'
import { totalProfileXp } from '@/services/rpg/calculations'

export function QuestPanel() {
  const { quests } = useQuestStore()
  const { user } = useUserStore()
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  return <Card><CardHeader><CardTitle>Nhiệm vụ & phục hồi</CardTitle></CardHeader><CardContent className="space-y-3">
    <p className="text-sm text-slate-400">Cấp {user.level} · {user.currentXp} / {user.nextLevelXp} XP · Tổng {totalProfileXp(user)} XP. XP không thay đổi hình thể.</p>
    <Progress value={user.currentXp} max={user.nextLevelXp} />
    <p className="text-xs text-slate-400">Ngày nghỉ là một phần kế hoạch. Không cần hoàn thành tất cả nhiệm vụ hay tập thêm để nhận thưởng.</p>
    {error && <p role="alert" className="text-rose-400 text-sm">{error}</p>}
    {quests.map(q => <div key={q.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
      <div className="flex justify-between gap-2"><strong className="text-sm text-white">{q.titleVi}</strong><Badge>{q.frequency === 'daily' ? 'Ngày' : 'Tuần'}</Badge></div>
      <p className="text-xs text-slate-400">{q.descriptionVi}</p><p className="text-xs text-slate-300">{q.periodStart} — {q.periodEnd} · {q.currentProgress}/{q.targetProgress} {q.unitVi} · {q.rewardXp} XP + {q.rewardGold} vàng</p>
      <Button size="sm" variant={q.isClaimed ? 'outline' : 'gold'} disabled={busy || q.isClaimed || (!q.isCompleted && q.questKind !== 'recovery')} onClick={async () => { setBusy(true); setError(''); try { await db.claimQuest(q.id, q.questKind === 'recovery') } catch (e) { setError(String(e)) } finally { setBusy(false) } }}>
        {q.isClaimed ? q.isCompleted ? 'Đã nhận' : 'Thưởng đã điều chỉnh' : q.questKind === 'recovery' && !q.isCompleted ? 'Xác nhận đã chăm sóc phục hồi' : 'Nhận thưởng'}
      </Button>
    </div>)}
  </CardContent></Card>
}
export function ProgressionHistory() {
  const { user } = useUserStore()
  const events = useLiveQuery(() => db.progressionEvents.where('userId').equals(user.id).toArray(), [user.id]) ?? []
  return <Card><CardHeader><CardTitle>Nhật ký XP & phần thưởng</CardTitle></CardHeader><CardContent className="space-y-2">
    <p className="text-xs text-slate-400">Chỉnh sửa / xóa buổi tập ghi khoản điều chỉnh. Huy hiệu đã đạt vẫn nằm trong lịch sử.</p>
    {!events.some(e => e.kind !== 'baseline') && <p className="text-sm text-slate-400">Chưa có sự kiện tiến trình.</p>}
    {[...events].filter(e => e.kind !== 'baseline').sort((a, b) => b.at.localeCompare(a.at) || b.revision - a.revision).slice(0, 50).map(e => <div key={e.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-800 py-2 text-xs text-slate-300"><span>{new Date(e.at).toLocaleString('vi-VN')} · {e.kind === 'workout' ? 'Buổi tập' : e.kind === 'achievement' ? 'Mở huy hiệu' : e.kind === 'adjustment' ? 'Điều chỉnh số dư cũ' : 'Nhiệm vụ'} · {e.revision ? 'Điều chỉnh' : 'Nhận lần đầu'}</span><span>{e.xpDelta > 0 ? '+' : ''}{e.xpDelta} XP · {e.goldDelta > 0 ? '+' : ''}{e.goldDelta} vàng</span></div>)}
  </CardContent></Card>
}
export function CosmeticRewards() {
  const { achievements } = useQuestStore()
  const { user } = useUserStore()
  const pendingWrites = useCharacterStore(state => state.pendingWrites)
  const [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const rewards = achievements.filter(a => a.unlocked && a.id.startsWith('rpg-ach:'))
  const apply = async (id: string, kind: 'title' | 'accent') => { if (pendingWrites) { setError('Đợi tùy chỉnh nhân vật lưu xong rồi áp dụng phần thưởng.'); return } setBusy(true); setError(''); try { await db.applyCosmetic(id, kind) } catch (e) { setError(String(e)) } finally { setBusy(false) } }
  return <Card><CardHeader><CardTitle>Huy hiệu & diện mạo đã mở</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-teal-300">Danh hiệu: {user.title}</p><p className="text-xs text-slate-400">Danh hiệu và màu điểm nhấn chỉ là trang trí. Thân trên để trần, quần ngắn; không đổi số đo hoặc hình thể.</p>
    {error && <p role="alert" className="text-rose-400">{error}</p>}{!rewards.length && <p className="text-sm text-slate-400">Lưu buổi tập để mở huy hiệu đầu tiên.</p>}
    {rewards.map(a => <div key={a.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"><Badge variant="gold">{a.titleVi}</Badge><p className="text-xs text-slate-400">Đạt: {a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString('vi-VN') : 'Đã lưu'}</p><div className="flex flex-wrap gap-2"><Button disabled={busy} size="sm" variant="outline" onClick={() => apply(a.id, 'title')}>{a.rewardTitle}</Button><Button disabled={busy} size="sm" variant="outline" onClick={() => apply(a.id, 'accent')}>Dùng màu huy hiệu <span className="h-3 w-3 rounded-full" style={{backgroundColor: a.rewardAccent}} /></Button></div></div>)}
  </CardContent></Card>
}
