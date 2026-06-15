import type { Metric, Trainer, TrainingClass } from '../types'

export const metrics: Metric[] = [
  { label: 'Agendamentos hoje', value: '38', helper: '12 confirmados pela manhã', trend: '+18%' },
  { label: 'Ocupação média', value: '82%', helper: 'salas e profissionais', trend: '+7%' },
  { label: 'Alunos ativos', value: '1.248', helper: '3 planos cadastrados', trend: '+34' },
  { label: 'Personal trainers', value: '16', helper: '4 com horário livre hoje', trend: 'online' }
]

export const trainers: Trainer[] = [
  { id: 1, name: 'Marina Costa', specialty: 'Hipertrofia feminina', rating: 4.9, sessionsToday: 8, avatar: 'MC' },
  { id: 2, name: 'Rafael Torres', specialty: 'Emagrecimento e funcional', rating: 4.8, sessionsToday: 6, avatar: 'RT' },
  { id: 3, name: 'Bruno Lima', specialty: 'Musculação avançada', rating: 4.7, sessionsToday: 7, avatar: 'BL' },
  { id: 4, name: 'Ana Beatriz', specialty: 'Pilates e mobilidade', rating: 5.0, sessionsToday: 5, avatar: 'AB' }
]

export const classes: TrainingClass[] = [
  { id: 1, title: 'Funcional Express', type: 'turma', trainer: 'Rafael Torres', day: 'Segunda', time: '07:00', duration: '45 min', capacity: 20, booked: 17, status: 'confirmed' },
  { id: 2, title: 'Personal premium', type: 'personal', trainer: 'Marina Costa', day: 'Segunda', time: '09:30', duration: '60 min', capacity: 1, booked: 1, status: 'confirmed' },
  { id: 3, title: 'Avaliação física', type: 'treino', trainer: 'Ana Beatriz', day: 'Segunda', time: '11:00', duration: '30 min', capacity: 1, booked: 0, status: 'pending' },
  { id: 4, title: 'HIIT Coletivo', type: 'turma', trainer: 'Bruno Lima', day: 'Terça', time: '18:30', duration: '40 min', capacity: 24, booked: 21, status: 'confirmed' },
  { id: 5, title: 'Pilates Solo', type: 'turma', trainer: 'Ana Beatriz', day: 'Quarta', time: '08:00', duration: '50 min', capacity: 12, booked: 9, status: 'pending' },
  { id: 6, title: 'Treino membros inferiores', type: 'personal', trainer: 'Marina Costa', day: 'Quinta', time: '16:00', duration: '60 min', capacity: 1, booked: 0, status: 'pending' },
  { id: 7, title: 'Musculação iniciante', type: 'turma', trainer: 'Bruno Lima', day: 'Sexta', time: '19:00', duration: '60 min', capacity: 18, booked: 13, status: 'confirmed' }
]

export const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
