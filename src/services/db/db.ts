import Dexie, { type Table } from 'dexie'
import type {
  UserProfile,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  BodyMeasurement,
  Goal,
  CharacterState,
  Achievement,
  Quest,
} from '@/types'
import {
  mockUserProfile,
  mockExercises,
  mockWorkoutSessions,
  mockPersonalRecords,
  mockBodyMeasurements,
  mockGoal,
  mockCharacterState,
  mockAchievements,
  mockQuests,
} from '@/mock'

export class FitForgeDatabase extends Dexie {
  users!: Table<UserProfile, string>
  exercises!: Table<Exercise, string>
  workoutSessions!: Table<WorkoutSession, string>
  personalRecords!: Table<PersonalRecord, string>
  bodyMeasurements!: Table<BodyMeasurement, string>
  goals!: Table<Goal, string>
  characterStates!: Table<CharacterState, string>
  achievements!: Table<Achievement, string>
  quests!: Table<Quest, string>

  constructor() {
    super('FitForgeRPG_DB')
    this.version(1).stores({
      users: 'id, level',
      exercises: 'id, muscleGroup, equipment',
      workoutSessions: 'id, date, splitType',
      personalRecords: 'id, exerciseId, achievedDate',
      bodyMeasurements: 'id, date',
      goals: 'id, category',
      characterStates: 'id, userId',
      achievements: 'id, code, category, unlocked',
      quests: 'id, frequency, isCompleted',
    })
  }

  /**
   * Initializes or seeds database with default mock data if empty.
   */
  async seedInitialData(): Promise<void> {
    const userCount = await this.users.count()
    if (userCount === 0) {
      await this.users.put(mockUserProfile)
      await this.exercises.bulkPut(mockExercises)
      await this.workoutSessions.bulkPut(mockWorkoutSessions)
      await this.personalRecords.bulkPut(mockPersonalRecords)
      await this.bodyMeasurements.bulkPut(mockBodyMeasurements)
      await this.goals.put(mockGoal)
      await this.characterStates.put(mockCharacterState)
      await this.achievements.bulkPut(mockAchievements)
      await this.quests.bulkPut(mockQuests)
    }
  }

  /**
   * Exports all IndexedDB data as a JSON object for local backups.
   */
  async exportFullBackup(): Promise<Record<string, unknown>> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: await this.users.toArray(),
      exercises: await this.exercises.toArray(),
      workoutSessions: await this.workoutSessions.toArray(),
      personalRecords: await this.personalRecords.toArray(),
      bodyMeasurements: await this.bodyMeasurements.toArray(),
      goals: await this.goals.toArray(),
      characterStates: await this.characterStates.toArray(),
      achievements: await this.achievements.toArray(),
      quests: await this.quests.toArray(),
    }
  }

  /**
   * Clears and resets database back to default initial mock state.
   */
  async resetToDemoState(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      for (const table of this.tables) {
        await table.clear()
      }
    })
    await this.seedInitialData()
  }
}

export const db = new FitForgeDatabase()
