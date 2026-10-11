import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { calculatePersonalRecords } from '@/services/workout/calculations'
import { useWorkoutStore, useUserStore, useCharacterStore, useInBodyStore, useQuestStore } from '@/stores'

export function DatabaseSync() {
  const recovered = useRef(false)
  const data = useLiveQuery(async () => {
    const [users, exercises, workouts, characters, measurements, quests, achievements] = await db.transaction('r', db.tables, () => Promise.all([
      db.users.toArray(), db.exercises.toArray(), db.workoutSessions.toArray(), db.characterStates.toArray(),
      db.bodyMeasurements.toArray(), db.quests.toArray(), db.achievements.toArray(),
    ]))
    const realWorkouts = workouts.filter(row => row.source !== 'demo')
    return { user: users.find(row => row.source !== 'demo'), exercises,
      sessions: realWorkouts.filter(row => row.status !== 'draft').sort((a, b) => b.date.localeCompare(a.date) || (b.startedAt ?? 0) - (a.startedAt ?? 0)),
      draft: realWorkouts.find(row => row.status === 'draft'), characters,
      measurements: measurements.filter(row => row.source !== 'demo').sort((a, b) => a.date.localeCompare(b.date)),
      quests: quests.filter(row => row.source !== 'demo'), achievements: achievements.filter(row => row.source !== 'demo') }
  }, [])
  useEffect(() => {
    if (!data) return
    useWorkoutStore.setState({ exercises: data.exercises, sessions: data.sessions,
      personalRecords: calculatePersonalRecords(data.sessions) })
    // Initial recovery only; live query must not replace in-flight form edits.
    if (!recovered.current) {
      recovered.current = true
      if (data.draft && !useWorkoutStore.getState().activeSession) useWorkoutStore.setState({ activeSession: data.draft })
    }
    if (data.user) useUserStore.setState({ user: data.user })
    const character = data.characters.find(row => row.source !== 'demo' && row.userId === data.user?.id)
    if (character && !useCharacterStore.getState().pendingWrites) useCharacterStore.setState({ character })
    useInBodyStore.setState({ measurements: data.measurements, latestMeasurement: data.measurements.at(-1) ?? null })
    useQuestStore.setState({ quests: data.quests, achievements: data.achievements })
  }, [data])
  return null
}
