export type Role = 'admin' | 'trainer' | 'student'

export type ScheduleStatus = 'confirmed' | 'pending' | 'cancelled'

export type Trainer = {
  id: number
  name: string
  specialty: string
  rating: number
  sessionsToday: number
  avatar: string
}

export type TrainingClass = {
  id: number
  title: string
  type: 'turma' | 'personal' | 'treino'
  trainer: string
  day: string
  time: string
  duration: string
  capacity: number
  booked: number
  status: ScheduleStatus
}

export type Metric = {
  label: string
  value: string
  helper: string
  trend: string
}
