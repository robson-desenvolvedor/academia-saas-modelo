import { FormEvent, useEffect, useMemo, useState } from 'react'

type Role = 'academy' | 'trainer' | 'student'
type View =
  | 'dashboard'
  | 'calendar'
  | 'sessions'
  | 'bookings'
  | 'users'
  | 'professionals'
  | 'reports'
  | 'settings'
  | 'students'
  | 'availability'
  | 'myBookings'
  | 'workout'
  | 'marketplace'

type UserStatus = 'active' | 'blocked'
type SessionStatus = 'open' | 'full' | 'cancelled' | 'done'
type BookingStatus = 'confirmed' | 'cancelled' | 'waiting'
type SessionKind = 'Turma' | 'Personal' | 'Avaliação' | 'Treino livre'
type Plan = 'Start' | 'Plus' | 'Black'

type User = {
  id: string
  name: string
  email: string
  password: string
  role: Role
  status: UserStatus
  linkedId?: string
  lastAccess: string
}

type Trainer = {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  specialty: string
  cref: string
  status: UserStatus
  rating: number
  bio: string
}

type Student = {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  plan: Plan
  status: UserStatus
  goal: string
  credits: number
  since: string
}

type Session = {
  id: string
  title: string
  kind: SessionKind
  trainerId: string
  startsAt: string
  endsAt: string
  capacity: number
  bookedStudentIds: string[]
  status: SessionStatus
  room: string
  notes: string
}

type Booking = {
  id: string
  sessionId: string
  studentId: string
  status: BookingStatus
  createdAt: string
}

type Availability = {
  id: string
  trainerId: string
  day: string
  start: string
  end: string
  service: string
  active: boolean
}

type Notification = {
  id: string
  toUserId: string
  title: string
  message: string
  createdAt: string
  read: boolean
}

type Settings = {
  gymName: string
  emailNotifications: boolean
  cancellationWindow: number
  defaultCapacity: number
  openHours: string
  whatsapp: string
}

type AppData = {
  users: User[]
  trainers: Trainer[]
  students: Student[]
  sessions: Session[]
  bookings: Booking[]
  availability: Availability[]
  notifications: Notification[]
  settings: Settings
}

type NavItem = { view: View; label: string; icon: string }
type Modal = 'session' | 'trainer' | 'student' | 'user' | 'availability' | null

const storageKey = 'fitagenda-multiperfil-v5'
const sessionKinds: SessionKind[] = ['Turma', 'Personal', 'Avaliação', 'Treino livre']
const plans: Plan[] = ['Start', 'Plus', 'Black']
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const brDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const brDateShort = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

const roleName: Record<Role, string> = {
  academy: 'Academia',
  trainer: 'Personal',
  student: 'Aluno',
}

const navByRole: Record<Role, NavItem[]> = {
  academy: [
    { view: 'dashboard', label: 'Painel', icon: '▦' },
    { view: 'calendar', label: 'Calendário', icon: '□' },
    { view: 'sessions', label: 'Aulas e horários', icon: '≡' },
    { view: 'bookings', label: 'Agendamentos', icon: '✓' },
    { view: 'users', label: 'Usuários', icon: '◎' },
    { view: 'professionals', label: 'Profissionais', icon: '◉' },
    { view: 'reports', label: 'Relatórios', icon: '▤' },
    { view: 'settings', label: 'Configurações', icon: '⚙' },
  ],
  trainer: [
    { view: 'dashboard', label: 'Painel', icon: '▦' },
    { view: 'calendar', label: 'Minha agenda', icon: '□' },
    { view: 'sessions', label: 'Sessões', icon: '≡' },
    { view: 'students', label: 'Meus alunos', icon: '◎' },
    { view: 'availability', label: 'Disponibilidade', icon: '◷' },
    { view: 'settings', label: 'Meu perfil', icon: '⚙' },
  ],
  student: [
    { view: 'dashboard', label: 'Início', icon: '▦' },
    { view: 'calendar', label: 'Agenda', icon: '□' },
    { view: 'marketplace', label: 'Reservar', icon: '+' },
    { view: 'myBookings', label: 'Minhas reservas', icon: '✓' },
    { view: 'workout', label: 'Treino', icon: '▤' },
    { view: 'professionals', label: 'Personais', icon: '◉' },
    { view: 'settings', label: 'Perfil', icon: '⚙' },
  ],
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function minutesFrom(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function addMinutes(date: Date, minutes: number) {
  const copy = new Date(date)
  copy.setMinutes(copy.getMinutes() + minutes)
  return copy
}

function buildDate(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function sameDay(iso: string, key: string) {
  return dateKey(new Date(iso)) === key
}

function byStartsAt(a: Session, b: Session) {
  return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
}

function buildSession(partial: Omit<Session, 'id' | 'startsAt' | 'endsAt'>, dayOffset: number, start: string, duration: number): Session {
  const base = new Date()
  base.setDate(base.getDate() + dayOffset)
  const day = dateKey(base)
  const startsAt = buildDate(day, start)
  const endsAt = addMinutes(startsAt, duration)
  return {
    ...partial,
    id: uid('sess'),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  }
}

function seedData(): AppData {
  const now = new Date().toISOString()
  const users: User[] = [
    { id: 'u-academy', name: 'Gestor Academia Prime', email: 'academia@demo.com', password: '123456', role: 'academy', status: 'active', lastAccess: now },
    { id: 'u-trainer-1', name: 'Marina Costa', email: 'personal@demo.com', password: '123456', role: 'trainer', status: 'active', linkedId: 'tr-1', lastAccess: now },
    { id: 'u-trainer-2', name: 'Rafael Torres', email: 'rafael@demo.com', password: '123456', role: 'trainer', status: 'active', linkedId: 'tr-2', lastAccess: now },
    { id: 'u-student-1', name: 'Camila Souza', email: 'aluno@demo.com', password: '123456', role: 'student', status: 'active', linkedId: 'st-1', lastAccess: now },
    { id: 'u-student-2', name: 'João Pedro', email: 'joao@demo.com', password: '123456', role: 'student', status: 'active', linkedId: 'st-2', lastAccess: now },
    { id: 'u-student-3', name: 'Nathália Lima', email: 'nathalia@demo.com', password: '123456', role: 'student', status: 'active', linkedId: 'st-3', lastAccess: now },
  ]

  const trainers: Trainer[] = [
    { id: 'tr-1', userId: 'u-trainer-1', name: 'Marina Costa', email: 'personal@demo.com', phone: '(66) 99999-1201', specialty: 'Hipertrofia e avaliação física', cref: 'CREF 012345-G/MT', status: 'active', rating: 4.9, bio: 'Personal com foco em hipertrofia, emagrecimento e acompanhamento premium.' },
    { id: 'tr-2', userId: 'u-trainer-2', name: 'Rafael Torres', email: 'rafael@demo.com', phone: '(66) 99999-1202', specialty: 'Funcional e performance', cref: 'CREF 065432-G/MT', status: 'active', rating: 4.8, bio: 'Especialista em funcional, condicionamento e treinos em grupo.' },
    { id: 'tr-3', userId: 'u-trainer-3', name: 'Ana Beatriz', email: 'ana@demo.com', phone: '(66) 99999-1203', specialty: 'Pilates e mobilidade', cref: 'CREF 078901-G/MT', status: 'active', rating: 4.7, bio: 'Atendimento focado em mobilidade, pilates solo e reabilitação leve.' },
    { id: 'tr-4', userId: 'u-trainer-4', name: 'Bruno Lima', email: 'bruno@demo.com', phone: '(66) 99999-1204', specialty: 'Musculação avançada', cref: 'CREF 045678-G/MT', status: 'blocked', rating: 4.6, bio: 'Treinos avançados, força e periodização.' },
  ]

  const students: Student[] = [
    { id: 'st-1', userId: 'u-student-1', name: 'Camila Souza', email: 'aluno@demo.com', phone: '(66) 98411-2210', plan: 'Black', status: 'active', goal: 'Hipertrofia', credits: 8, since: '2025-11-02' },
    { id: 'st-2', userId: 'u-student-2', name: 'João Pedro', email: 'joao@demo.com', phone: '(66) 98112-4002', plan: 'Plus', status: 'active', goal: 'Emagrecimento', credits: 4, since: '2026-01-10' },
    { id: 'st-3', userId: 'u-student-3', name: 'Nathália Lima', email: 'nathalia@demo.com', phone: '(66) 99644-3010', plan: 'Start', status: 'active', goal: 'Condicionamento', credits: 2, since: '2026-04-18' },
    { id: 'st-4', userId: 'u-student-4', name: 'Lucas Ferreira', email: 'lucas@demo.com', phone: '(66) 99877-1212', plan: 'Plus', status: 'active', goal: 'Força', credits: 5, since: '2026-03-07' },
    { id: 'st-5', userId: 'u-student-5', name: 'Bianca Alves', email: 'bianca@demo.com', phone: '(66) 99610-8877', plan: 'Black', status: 'active', goal: 'Definição', credits: 10, since: '2025-09-22' },
  ]

  const sessions: Session[] = [
    buildSession({ title: 'Funcional Express', kind: 'Turma', trainerId: 'tr-2', capacity: 18, bookedStudentIds: ['st-1', 'st-2', 'st-5'], status: 'open', room: 'Sala 01', notes: 'Aula em grupo de alta intensidade.' }, 0, '07:00', 45),
    buildSession({ title: 'Personal Premium', kind: 'Personal', trainerId: 'tr-1', capacity: 1, bookedStudentIds: ['st-1'], status: 'full', room: 'Box Personal', notes: 'Atendimento individual.' }, 0, '09:30', 60),
    buildSession({ title: 'Avaliação física', kind: 'Avaliação', trainerId: 'tr-1', capacity: 1, bookedStudentIds: [], status: 'open', room: 'Consultório', notes: 'Bioimpedância, anamnese e medidas.' }, 1, '10:00', 40),
    buildSession({ title: 'Pilates Solo', kind: 'Turma', trainerId: 'tr-3', capacity: 12, bookedStudentIds: ['st-3', 'st-4'], status: 'open', room: 'Studio', notes: 'Mobilidade e fortalecimento.' }, 1, '18:00', 50),
    buildSession({ title: 'Musculação iniciante', kind: 'Turma', trainerId: 'tr-4', capacity: 16, bookedStudentIds: ['st-2', 'st-3', 'st-5'], status: 'open', room: 'Sala 02', notes: 'Orientação para iniciantes.' }, 2, '19:00', 60),
    buildSession({ title: 'Treino inferiores', kind: 'Personal', trainerId: 'tr-1', capacity: 1, bookedStudentIds: [], status: 'open', room: 'Box Personal', notes: 'Sessão individual para membros inferiores.' }, 2, '16:00', 60),
    buildSession({ title: 'HIIT Coletivo', kind: 'Turma', trainerId: 'tr-2', capacity: 24, bookedStudentIds: ['st-1', 'st-2', 'st-3', 'st-4'], status: 'open', room: 'Área Funcional', notes: 'Treino intervalado de alta intensidade.' }, 3, '06:30', 35),
    buildSession({ title: 'Treino livre monitorado', kind: 'Treino livre', trainerId: 'tr-2', capacity: 30, bookedStudentIds: ['st-5'], status: 'open', room: 'Musculação', notes: 'Sala aberta com suporte de profissional.' }, 4, '20:00', 90),
    buildSession({ title: 'Personal Performance', kind: 'Personal', trainerId: 'tr-1', capacity: 1, bookedStudentIds: [], status: 'open', room: 'Box Personal', notes: 'Sessão premium com plano individual.' }, 5, '08:30', 60),
    buildSession({ title: 'Alongamento e mobilidade', kind: 'Turma', trainerId: 'tr-3', capacity: 15, bookedStudentIds: ['st-3'], status: 'open', room: 'Studio', notes: 'Aula leve para recuperação.' }, 6, '09:00', 45),
  ].sort(byStartsAt)

  const bookings: Booking[] = []
  sessions.forEach((session) => {
    session.bookedStudentIds.forEach((studentId) => bookings.push({ id: uid('book'), sessionId: session.id, studentId, status: 'confirmed', createdAt: now }))
  })

  return {
    users,
    trainers,
    students,
    sessions,
    bookings,
    availability: [
      { id: 'av-1', trainerId: 'tr-1', day: 'Segunda', start: '07:00', end: '12:00', service: 'Personal / avaliação', active: true },
      { id: 'av-2', trainerId: 'tr-1', day: 'Quarta', start: '15:00', end: '21:00', service: 'Personal premium', active: true },
      { id: 'av-3', trainerId: 'tr-2', day: 'Terça', start: '06:00', end: '11:00', service: 'Funcional / turma', active: true },
      { id: 'av-4', trainerId: 'tr-3', day: 'Sexta', start: '17:00', end: '21:00', service: 'Pilates / mobilidade', active: true },
    ],
    notifications: [
      { id: 'nt-1', toUserId: 'u-student-1', title: 'Reserva confirmada', message: 'Seu horário com Marina Costa foi confirmado.', createdAt: now, read: false },
      { id: 'nt-2', toUserId: 'u-trainer-1', title: 'Nova sessão agendada', message: 'Camila Souza está confirmada no Personal Premium.', createdAt: now, read: false },
      { id: 'nt-3', toUserId: 'u-academy', title: 'Agenda atualizada', message: 'Aula Funcional Express recebeu novas reservas.', createdAt: now, read: false },
    ],
    settings: {
      gymName: 'Academia Prime Fit',
      emailNotifications: true,
      cancellationWindow: 2,
      defaultCapacity: 18,
      openHours: 'Segunda a sexta das 05:30 às 22:00 • Sábado das 07:00 às 14:00',
      whatsapp: '(66) 99999-0000',
    },
  }
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return seedData()
    return JSON.parse(raw) as AppData
  } catch {
    return seedData()
  }
}

function getStoredUser(data: AppData) {
  const userId = localStorage.getItem(`${storageKey}:user`)
  return data.users.find((user) => user.id === userId && user.status === 'active') ?? null
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData())
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser(loadData()))
  const [view, setView] = useState<View>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()))
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (currentUser) localStorage.setItem(`${storageKey}:user`, currentUser.id)
    else localStorage.removeItem(`${storageKey}:user`)
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    const available = navByRole[currentUser.role].map((item) => item.view)
    if (!available.includes(view)) setView(available[0])
  }, [currentUser, view])

  const role = currentUser?.role ?? 'academy'
  const nav = navByRole[role]
  const currentTrainer = currentUser?.role === 'trainer' ? data.trainers.find((trainer) => trainer.id === currentUser.linkedId) : null
  const currentStudent = currentUser?.role === 'student' ? data.students.find((student) => student.id === currentUser.linkedId) : null

  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return data.sessions
      .filter((session) => {
        if (currentUser?.role === 'trainer') return session.trainerId === currentUser.linkedId
        return true
      })
      .filter((session) => {
        if (currentUser?.role === 'student') return session.status !== 'cancelled'
        return true
      })
      .filter((session) => {
        if (statusFilter !== 'all') return session.status === statusFilter
        return true
      })
      .filter((session) => {
        if (!normalized) return true
        const trainer = trainerById(session.trainerId)
        return `${session.title} ${session.kind} ${session.room} ${trainer?.name ?? ''}`.toLowerCase().includes(normalized)
      })
      .sort(byStartsAt)
  }, [data.sessions, currentUser, query, statusFilter])

  const selectedSessions = visibleSessions.filter((session) => sameDay(session.startsAt, selectedDate))
  const notificationsForUser = data.notifications.filter((item) => !currentUser || item.toUserId === currentUser.id || currentUser.role === 'academy').slice(0, 6)

  function trainerById(id: string) {
    return data.trainers.find((trainer) => trainer.id === id)
  }

  function studentById(id: string) {
    return data.students.find((student) => student.id === id)
  }

  function sessionById(id: string) {
    return data.sessions.find((session) => session.id === id)
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function resetDemo() {
    const fresh = seedData()
    setData(fresh)
    setCurrentUser(null)
    setView('dashboard')
    localStorage.removeItem(`${storageKey}:user`)
    showToast('Demo reiniciada com dados originais.')
  }

  function login(email: string, password: string) {
    const found = data.users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password)
    if (!found) {
      showToast('E-mail ou senha inválidos. Use os acessos de demonstração.')
      return
    }
    if (found.status !== 'active') {
      showToast('Usuário bloqueado na demonstração.')
      return
    }
    const updated = { ...found, lastAccess: new Date().toISOString() }
    setData((current) => ({ ...current, users: current.users.map((user) => (user.id === updated.id ? updated : user)) }))
    setCurrentUser(updated)
    setView(navByRole[updated.role][0].view)
    showToast(`Login realizado como ${roleName[updated.role]}.`)
  }

  function quickLogin(roleToLogin: Role) {
    const demo = roleToLogin === 'academy' ? 'academia@demo.com' : roleToLogin === 'trainer' ? 'personal@demo.com' : 'aluno@demo.com'
    login(demo, '123456')
  }

  function addNotification(toUserId: string, title: string, message: string) {
    setData((current) => ({
      ...current,
      notifications: [{ id: uid('nt'), toUserId, title, message, createdAt: new Date().toISOString(), read: false }, ...current.notifications],
    }))
  }

  function reserveSession(session: Session, forcedStudentId?: string) {
    const studentId = forcedStudentId ?? currentStudent?.id
    if (!studentId) {
      showToast('Selecione um aluno para reservar este horário.')
      return
    }
    if (session.status === 'cancelled' || session.status === 'done') {
      showToast('Este horário não está disponível.')
      return
    }
    if (session.bookedStudentIds.includes(studentId)) {
      showToast('Este aluno já está confirmado neste horário.')
      return
    }
    if (session.bookedStudentIds.length >= session.capacity) {
      showToast('Horário lotado. Não há vagas disponíveis.')
      return
    }

    const student = studentById(studentId)
    const trainer = trainerById(session.trainerId)
    const booking: Booking = { id: uid('book'), sessionId: session.id, studentId, status: 'confirmed', createdAt: new Date().toISOString() }
    setData((current) => ({
      ...current,
      sessions: current.sessions.map((item) => {
        if (item.id !== session.id) return item
        const ids = [...item.bookedStudentIds, studentId]
        return { ...item, bookedStudentIds: ids, status: ids.length >= item.capacity ? 'full' : 'open' }
      }),
      bookings: [booking, ...current.bookings],
      students: current.students.map((item) => (item.id === studentId ? { ...item, credits: Math.max(0, item.credits - 1) } : item)),
    }))
    if (student) addNotification(student.userId, 'Reserva confirmada', `${session.title} em ${brDate.format(new Date(session.startsAt))} às ${timeLabel(session.startsAt)}.`)
    if (trainer) addNotification(trainer.userId, 'Novo aluno confirmado', `${student?.name ?? 'Aluno'} reservou ${session.title}.`)
    showToast('Reserva confirmada e notificação simulada gerada.')
  }

  function cancelBooking(bookingId: string) {
    const booking = data.bookings.find((item) => item.id === bookingId)
    if (!booking || booking.status === 'cancelled') return
    const session = sessionById(booking.sessionId)
    const student = studentById(booking.studentId)
    setData((current) => ({
      ...current,
      bookings: current.bookings.map((item) => (item.id === bookingId ? { ...item, status: 'cancelled' } : item)),
      sessions: current.sessions.map((item) => {
        if (item.id !== booking.sessionId) return item
        const ids = item.bookedStudentIds.filter((studentId) => studentId !== booking.studentId)
        return { ...item, bookedStudentIds: ids, status: item.status === 'cancelled' || item.status === 'done' ? item.status : 'open' }
      }),
      students: current.students.map((item) => (item.id === booking.studentId ? { ...item, credits: item.credits + 1 } : item)),
    }))
    if (student && session) addNotification(student.userId, 'Reserva cancelada', `Sua reserva em ${session.title} foi cancelada.`)
    showToast('Reserva cancelada e vaga liberada.')
  }

  function updateSessionStatus(id: string, status: SessionStatus) {
    setData((current) => ({ ...current, sessions: current.sessions.map((item) => (item.id === id ? { ...item, status } : item)) }))
    showToast(status === 'cancelled' ? 'Horário cancelado.' : status === 'done' ? 'Sessão marcada como concluída.' : 'Horário reaberto.')
  }

  function deleteSession(id: string) {
    setData((current) => ({ ...current, sessions: current.sessions.filter((item) => item.id !== id), bookings: current.bookings.filter((item) => item.sessionId !== id) }))
    showToast('Horário removido da demonstração.')
  }

  function saveSession(form: FormEvent<HTMLFormElement>) {
    form.preventDefault()
    const fd = new FormData(form.currentTarget)
    const date = String(fd.get('date'))
    const start = String(fd.get('start'))
    const duration = Number(fd.get('duration') || 60)
    const trainerId = currentUser?.role === 'trainer' ? currentUser.linkedId ?? '' : String(fd.get('trainerId'))
    const startsAt = buildDate(date, start)
    const endsAt = addMinutes(startsAt, duration)
    const session: Session = {
      id: uid('sess'),
      title: String(fd.get('title') || 'Novo horário'),
      kind: String(fd.get('kind')) as SessionKind,
      trainerId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      capacity: Math.max(1, Number(fd.get('capacity') || 1)),
      bookedStudentIds: [],
      status: 'open',
      room: String(fd.get('room') || 'Sala principal'),
      notes: String(fd.get('notes') || ''),
    }
    setData((current) => ({ ...current, sessions: [...current.sessions, session].sort(byStartsAt) }))
    setSelectedDate(date)
    setModal(null)
    showToast('Horário criado com sucesso na demo.')
  }

  function saveTrainer(form: FormEvent<HTMLFormElement>) {
    form.preventDefault()
    const fd = new FormData(form.currentTarget)
    const userId = uid('user')
    const trainerId = uid('tr')
    const email = String(fd.get('email'))
    const name = String(fd.get('name'))
    const user: User = { id: userId, name, email, password: '123456', role: 'trainer', status: 'active', linkedId: trainerId, lastAccess: '-' }
    const trainer: Trainer = {
      id: trainerId,
      userId,
      name,
      email,
      phone: String(fd.get('phone')),
      specialty: String(fd.get('specialty')),
      cref: String(fd.get('cref')),
      status: 'active',
      rating: 5,
      bio: String(fd.get('bio')),
    }
    setData((current) => ({ ...current, users: [user, ...current.users], trainers: [trainer, ...current.trainers] }))
    setModal(null)
    showToast('Personal cadastrado com acesso de demonstração.')
  }

  function saveStudent(form: FormEvent<HTMLFormElement>) {
    form.preventDefault()
    const fd = new FormData(form.currentTarget)
    const userId = uid('user')
    const studentId = uid('st')
    const email = String(fd.get('email'))
    const name = String(fd.get('name'))
    const user: User = { id: userId, name, email, password: '123456', role: 'student', status: 'active', linkedId: studentId, lastAccess: '-' }
    const student: Student = {
      id: studentId,
      userId,
      name,
      email,
      phone: String(fd.get('phone')),
      plan: String(fd.get('plan')) as Plan,
      status: 'active',
      goal: String(fd.get('goal')),
      credits: Number(fd.get('credits') || 0),
      since: dateKey(new Date()),
    }
    setData((current) => ({ ...current, users: [user, ...current.users], students: [student, ...current.students] }))
    setModal(null)
    showToast('Aluno cadastrado com acesso de demonstração.')
  }

  function saveAvailability(form: FormEvent<HTMLFormElement>) {
    form.preventDefault()
    const fd = new FormData(form.currentTarget)
    const trainerId = currentUser?.role === 'trainer' ? currentUser.linkedId ?? '' : String(fd.get('trainerId'))
    const start = String(fd.get('start'))
    const end = String(fd.get('end'))
    if (minutesFrom(end) <= minutesFrom(start)) {
      showToast('O horário final precisa ser maior que o inicial.')
      return
    }
    const item: Availability = { id: uid('av'), trainerId, day: String(fd.get('day')), start, end, service: String(fd.get('service')), active: true }
    setData((current) => ({ ...current, availability: [item, ...current.availability] }))
    setModal(null)
    showToast('Disponibilidade adicionada.')
  }

  function toggleUser(userId: string) {
    setData((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === userId ? { ...user, status: user.status === 'active' ? 'blocked' : 'active' } : user)),
      trainers: current.trainers.map((trainer) => (trainer.userId === userId ? { ...trainer, status: trainer.status === 'active' ? 'blocked' : 'active' } : trainer)),
      students: current.students.map((student) => (student.userId === userId ? { ...student, status: student.status === 'active' ? 'blocked' : 'active' } : student)),
    }))
    showToast('Status do usuário alterado.')
  }

  function exportCsv() {
    const lines = ['tipo,titulo,profissional,data,hora,status,vagas']
    data.sessions.forEach((session) => {
      const trainer = trainerById(session.trainerId)
      lines.push([session.kind, session.title, trainer?.name ?? '', brDate.format(new Date(session.startsAt)), timeLabel(session.startsAt), session.status, `${session.bookedStudentIds.length}/${session.capacity}`].join(','))
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'agenda-fitagenda-demo.csv'
    link.click()
    URL.revokeObjectURL(url)
    showToast('CSV gerado.')
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} onQuickLogin={quickLogin} onReset={resetDemo} />
  }

  const metricSessions = data.sessions.filter((session) => session.status !== 'cancelled')
  const confirmedBookings = data.bookings.filter((booking) => booking.status === 'confirmed')
  const occupancy = metricSessions.length ? Math.round((confirmedBookings.length / metricSessions.reduce((total, session) => total + session.capacity, 0)) * 100) : 0

  return (
    <div className={`appShell ${sidebarCollapsed ? 'sidebarCollapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brandBlock">
          <div className="brandMark">F</div>
          {!sidebarCollapsed && (
            <div>
              <b>FitAgenda</b>
              <span>SaaS multi-perfil</span>
            </div>
          )}
        </div>
        <button className="collapseBtn" onClick={() => setSidebarCollapsed((value) => !value)}>{sidebarCollapsed ? '→' : '← Recolher'}</button>
        <nav className="sideNav">
          {nav.map((item) => (
            <button key={item.view} className={view === item.view ? 'active' : ''} onClick={() => setView(item.view)} title={item.label}>
              <span>{item.icon}</span>
              {!sidebarCollapsed && item.label}
            </button>
          ))}
        </nav>
        <div className="sideFooter">
          <span>{roleName[currentUser.role]}</span>
          {!sidebarCollapsed && <small>{currentUser.email}</small>}
        </div>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <div>
            <span className="eyebrow">{roleName[currentUser.role]} • {data.settings.gymName}</span>
            <h1>{titleForView(view, currentUser.role)}</h1>
          </div>
          <div className="topActions">
            <button className="ghostBtn" onClick={() => setView('calendar')}>Calendário</button>
            {currentUser.role !== 'student' && <button className="primaryBtn" onClick={() => setModal('session')}>Novo horário</button>}
            <button className="ghostBtn" onClick={() => setCurrentUser(null)}>Sair</button>
          </div>
        </header>

        <section className="summaryBar">
          <div>
            <span className="statusDot">● Online sem banco</span>
            <strong>Dados salvos no navegador para simular uma operação real.</strong>
            <p>Login, menus, reservas, cancelamentos, cadastros e notificações funcionam na própria demo.</p>
          </div>
          <div className="summaryActions">
            <button className="secondaryBtn" onClick={exportCsv}>Exportar CSV</button>
            <button className="dangerBtn" onClick={resetDemo}>Resetar demo</button>
          </div>
        </section>

        {view === 'dashboard' && renderDashboard()}
        {view === 'calendar' && renderCalendar()}
        {view === 'sessions' && renderSessions()}
        {view === 'bookings' && renderBookings()}
        {view === 'users' && renderUsers()}
        {view === 'professionals' && renderProfessionals()}
        {view === 'reports' && renderReports()}
        {view === 'students' && renderTrainerStudents()}
        {view === 'availability' && renderAvailability()}
        {view === 'myBookings' && renderMyBookings()}
        {view === 'workout' && renderWorkout()}
        {view === 'marketplace' && renderMarketplace()}
        {view === 'settings' && renderSettings()}
      </main>

      <nav className="mobileNav">
        {nav.slice(0, 5).map((item) => (
          <button key={item.view} className={view === item.view ? 'active' : ''} onClick={() => setView(item.view)}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
      {modal === 'session' && <SessionModal />}
      {modal === 'trainer' && <TrainerModal />}
      {modal === 'student' && <StudentModal />}
      {modal === 'availability' && <AvailabilityModal />}
    </div>
  )

  function renderDashboard() {
    if (currentUser?.role === 'student') return renderStudentDashboard()
    if (currentUser?.role === 'trainer') return renderTrainerDashboard()
    return (
      <div className="pageStack">
        <div className="metricsStrip">
          <Metric label="Agendamentos ativos" value={confirmedBookings.length} hint="confirmados" />
          <Metric label="Aulas abertas" value={data.sessions.filter((item) => item.status === 'open').length} hint="com vaga" />
          <Metric label="Ocupação média" value={`${occupancy}%`} hint="capacidade usada" />
          <Metric label="Usuários" value={data.users.length} hint="com login" />
        </div>
        <div className="gridTwo">
          <Panel title="Próximos horários" action={<button className="secondaryBtn" onClick={() => setView('sessions')}>Ver lista</button>}>
            <SessionTable sessions={data.sessions.slice(0, 7)} compact />
          </Panel>
          <Panel title="Atividade recente">
            <ActivityList />
          </Panel>
        </div>
      </div>
    )
  }

  function renderTrainerDashboard() {
    const trainerSessions = data.sessions.filter((item) => item.trainerId === currentUser?.linkedId)
    const activeStudents = uniqueStudentIds(trainerSessions).length
    return (
      <div className="pageStack">
        <div className="metricsStrip">
          <Metric label="Minhas sessões" value={trainerSessions.length} hint="no período" />
          <Metric label="Alunos atendidos" value={activeStudents} hint="únicos" />
          <Metric label="Hoje" value={trainerSessions.filter((item) => sameDay(item.startsAt, dateKey(new Date()))).length} hint="na agenda" />
          <Metric label="Avaliação" value={currentTrainer?.rating ?? 5} hint="nota média" />
        </div>
        <div className="gridTwo">
          <Panel title="Minha agenda mais próxima" action={<button className="primaryBtn" onClick={() => setModal('session')}>Abrir horário</button>}>
            <SessionTable sessions={trainerSessions.slice(0, 7)} compact />
          </Panel>
          <Panel title="Notificações e solicitações"><ActivityList /></Panel>
        </div>
      </div>
    )
  }

  function renderStudentDashboard() {
    const mine = data.bookings.filter((item) => item.studentId === currentStudent?.id && item.status === 'confirmed')
    const next = mine.map((booking) => sessionById(booking.sessionId)).filter(Boolean) as Session[]
    return (
      <div className="pageStack">
        <div className="metricsStrip">
          <Metric label="Reservas ativas" value={mine.length} hint="confirmadas" />
          <Metric label="Créditos" value={currentStudent?.credits ?? 0} hint="sessões disponíveis" />
          <Metric label="Plano" value={currentStudent?.plan ?? '-'} hint="assinatura" />
          <Metric label="Objetivo" value={currentStudent?.goal ?? '-'} hint="meta atual" />
        </div>
        <div className="gridTwo">
          <Panel title="Próximos treinos" action={<button className="primaryBtn" onClick={() => setView('marketplace')}>Reservar horário</button>}>
            <SessionTable sessions={next.slice(0, 6)} compact />
          </Panel>
          <Panel title="Avisos"><ActivityList /></Panel>
        </div>
      </div>
    )
  }

  function renderCalendar() {
    const cells = monthCells(calendarMonth)
    return (
      <div className="calendarLayout">
        <Panel title={monthTitle.format(calendarMonth)} action={<div className="buttonGroup"><button className="secondaryBtn" onClick={() => setCalendarMonth(moveMonth(calendarMonth, -1))}>Anterior</button><button className="secondaryBtn" onClick={() => setCalendarMonth(new Date())}>Hoje</button><button className="secondaryBtn" onClick={() => setCalendarMonth(moveMonth(calendarMonth, 1))}>Próximo</button></div>}>
          <div className="weekdayGrid">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="monthGrid">
            {cells.map((cell) => {
              const key = dateKey(cell)
              const inMonth = cell.getMonth() === calendarMonth.getMonth()
              const daySessions = visibleSessions.filter((session) => sameDay(session.startsAt, key))
              const isToday = key === dateKey(new Date())
              return (
                <button key={key} className={`calendarDay ${!inMonth ? 'muted' : ''} ${selectedDate === key ? 'selected' : ''}`} onClick={() => setSelectedDate(key)}>
                  <span className={isToday ? 'todayNumber' : ''}>{cell.getDate()}</span>
                  <small>{daySessions.length ? `${daySessions.length} horário(s)` : 'sem agenda'}</small>
                  <div className="eventDots">{daySessions.slice(0, 4).map((session) => <i key={session.id} className={session.status} />)}</div>
                </button>
              )
            })}
          </div>
        </Panel>
        <Panel title={brDate.format(new Date(`${selectedDate}T00:00:00`))} className="stickyPanel" action={currentUser?.role !== 'student' ? <button className="primaryBtn" onClick={() => setModal('session')}>Adicionar</button> : undefined}>
          <div className="dayAgenda">
            {selectedSessions.length === 0 && <div className="emptyState">Nenhum horário para este dia.</div>}
            {selectedSessions.map((session) => <SessionCard key={session.id} session={session} />)}
          </div>
        </Panel>
      </div>
    )
  }

  function renderSessions() {
    return (
      <Panel title={currentUser?.role === 'trainer' ? 'Minhas sessões' : 'Aulas e horários'} action={<button className="primaryBtn" onClick={() => setModal('session')}>Novo horário</button>}>
        <Toolbar />
        <SessionTable sessions={visibleSessions} />
      </Panel>
    )
  }

  function renderBookings() {
    const rows = data.bookings.filter((booking) => {
      const session = sessionById(booking.sessionId)
      const student = studentById(booking.studentId)
      const normalized = query.trim().toLowerCase()
      if (!normalized) return true
      return `${session?.title ?? ''} ${student?.name ?? ''} ${booking.status}`.toLowerCase().includes(normalized)
    })
    return (
      <Panel title="Agendamentos" action={<button className="secondaryBtn" onClick={exportCsv}>Exportar</button>}>
        <Toolbar hideStatus />
        <BookingTable bookings={rows} />
      </Panel>
    )
  }

  function renderUsers() {
    return (
      <div className="pageStack">
        <Panel title="Usuários de acesso" action={<div className="buttonGroup"><button className="primaryBtn" onClick={() => setModal('student')}>Novo aluno</button><button className="secondaryBtn" onClick={() => setModal('trainer')}>Novo personal</button></div>}>
          <div className="tableWrap"><table className="dataTable"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>
            {data.users.map((user) => <tr key={user.id}><td data-label="Nome"><strong>{user.name}</strong></td><td data-label="E-mail">{user.email}</td><td data-label="Perfil">{roleName[user.role]}</td><td data-label="Status"><StatusBadge status={user.status} /></td><td data-label="Último acesso">{user.lastAccess === '-' ? '-' : brDateShort.format(new Date(user.lastAccess))}</td><td data-label="Ações"><button className="secondaryBtn compactBtn" onClick={() => toggleUser(user.id)}>{user.status === 'active' ? 'Bloquear' : 'Ativar'}</button></td></tr>)}
          </tbody></table></div>
        </Panel>
        <Panel title="Alunos cadastrados">
          <StudentsTable students={data.students} />
        </Panel>
      </div>
    )
  }

  function renderProfessionals() {
    const source = currentUser?.role === 'student' ? data.trainers.filter((trainer) => trainer.status === 'active') : data.trainers
    return (
      <Panel title={currentUser?.role === 'student' ? 'Personais disponíveis' : 'Profissionais'} action={currentUser?.role === 'academy' ? <button className="primaryBtn" onClick={() => setModal('trainer')}>Novo personal</button> : undefined}>
        <div className="professionalGrid">
          {source.map((trainer) => (
            <article key={trainer.id} className="profileCard">
              <div className="avatar">{trainer.name.slice(0, 1)}</div>
              <div>
                <h3>{trainer.name}</h3>
                <p>{trainer.specialty}</p>
                <small>{trainer.cref} • ★ {trainer.rating}</small>
              </div>
              <p className="bioText">{trainer.bio}</p>
              <div className="buttonGroup">
                <StatusBadge status={trainer.status} />
                {currentUser?.role === 'academy' && <button className="secondaryBtn compactBtn" onClick={() => toggleUser(trainer.userId)}>{trainer.status === 'active' ? 'Bloquear' : 'Ativar'}</button>}
                {currentUser?.role === 'student' && <button className="primaryBtn compactBtn" onClick={() => { setQuery(trainer.name); setView('marketplace') }}>Ver horários</button>}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    )
  }

  function renderReports() {
    const byTrainer = data.trainers.map((trainer) => {
      const sessions = data.sessions.filter((session) => session.trainerId === trainer.id)
      const capacity = sessions.reduce((total, session) => total + session.capacity, 0)
      const booked = sessions.reduce((total, session) => total + session.bookedStudentIds.length, 0)
      return { trainer, sessions: sessions.length, booked, capacity, percent: capacity ? Math.round((booked / capacity) * 100) : 0 }
    })
    return (
      <div className="pageStack">
        <div className="metricsStrip">
          <Metric label="Receita simulada" value="R$ 8.740" hint="mês atual" />
          <Metric label="Taxa ocupação" value={`${occupancy}%`} hint="vagas usadas" />
          <Metric label="Cancelamentos" value={data.bookings.filter((item) => item.status === 'cancelled').length} hint="na demo" />
          <Metric label="Novas reservas" value={data.bookings.length} hint="histórico" />
        </div>
        <Panel title="Ocupação por profissional" action={<button className="secondaryBtn" onClick={exportCsv}>Exportar relatório</button>}>
          <div className="tableWrap"><table className="dataTable"><thead><tr><th>Profissional</th><th>Sessões</th><th>Reservas</th><th>Capacidade</th><th>Ocupação</th></tr></thead><tbody>
            {byTrainer.map((item) => <tr key={item.trainer.id}><td data-label="Profissional"><strong>{item.trainer.name}</strong><small>{item.trainer.specialty}</small></td><td data-label="Sessões">{item.sessions}</td><td data-label="Reservas">{item.booked}</td><td data-label="Capacidade">{item.capacity}</td><td data-label="Ocupação"><Progress value={item.percent} /></td></tr>)}
          </tbody></table></div>
        </Panel>
      </div>
    )
  }

  function renderTrainerStudents() {
    const ids = uniqueStudentIds(data.sessions.filter((item) => item.trainerId === currentUser?.linkedId))
    const rows = data.students.filter((student) => ids.includes(student.id))
    return <Panel title="Meus alunos"><StudentsTable students={rows} /></Panel>
  }

  function renderAvailability() {
    const rows = data.availability.filter((item) => currentUser?.role !== 'trainer' || item.trainerId === currentUser.linkedId)
    return (
      <Panel title="Disponibilidade" action={<button className="primaryBtn" onClick={() => setModal('availability')}>Adicionar faixa</button>}>
        <div className="tableWrap"><table className="dataTable"><thead><tr><th>Dia</th><th>Horário</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Ações</th></tr></thead><tbody>
          {rows.map((item) => <tr key={item.id}><td data-label="Dia"><strong>{item.day}</strong></td><td data-label="Horário">{item.start} às {item.end}</td><td data-label="Serviço">{item.service}</td><td data-label="Profissional">{trainerById(item.trainerId)?.name}</td><td data-label="Status"><StatusBadge status={item.active ? 'active' : 'blocked'} /></td><td data-label="Ações"><button className="secondaryBtn compactBtn" onClick={() => setData((current) => ({ ...current, availability: current.availability.map((av) => av.id === item.id ? { ...av, active: !av.active } : av) }))}>{item.active ? 'Pausar' : 'Ativar'}</button></td></tr>)}
        </tbody></table></div>
      </Panel>
    )
  }

  function renderMyBookings() {
    const mine = data.bookings.filter((booking) => booking.studentId === currentStudent?.id)
    return <Panel title="Minhas reservas"><BookingTable bookings={mine} /></Panel>
  }

  function renderWorkout() {
    return (
      <div className="pageStack">
        <div className="metricsStrip">
          <Metric label="Objetivo" value={currentStudent?.goal ?? '-'} hint="plano atual" />
          <Metric label="Frequência" value="4x" hint="por semana" />
          <Metric label="Check-ins" value="16" hint="no mês" />
          <Metric label="Evolução" value="+7%" hint="carga média" />
        </div>
        <Panel title="Treino da semana">
          <div className="workoutGrid">
            {['A - Peito e tríceps', 'B - Costas e bíceps', 'C - Pernas', 'D - Ombros e core'].map((item, index) => <article key={item} className="workoutCard"><span>Dia {index + 1}</span><h3>{item}</h3><p>4 exercícios principais • 3 a 4 séries • descanso controlado</p><button className="secondaryBtn compactBtn">Ver ficha</button></article>)}
          </div>
        </Panel>
      </div>
    )
  }

  function renderMarketplace() {
    const open = visibleSessions.filter((session) => session.status === 'open')
    return (
      <Panel title="Reservar horário" action={<button className="secondaryBtn" onClick={() => setQuery('')}>Limpar filtro</button>}>
        <Toolbar />
        <SessionTable sessions={open} />
      </Panel>
    )
  }

  function renderSettings() {
    const profileName = currentUser?.role === 'trainer' ? currentTrainer?.name : currentUser?.role === 'student' ? currentStudent?.name : data.settings.gymName
    return (
      <div className="settingsGrid">
        <Panel title={currentUser?.role === 'academy' ? 'Configurações da academia' : 'Meu perfil'}>
          <form className="formGrid" onSubmit={(event) => { event.preventDefault(); showToast('Configurações salvas na demonstração.') }}>
            <label>Nome<input defaultValue={profileName} /></label>
            <label>WhatsApp<input defaultValue={currentUser?.role === 'academy' ? data.settings.whatsapp : currentTrainer?.phone ?? currentStudent?.phone} /></label>
            {currentUser?.role === 'academy' && <><label>Horário de funcionamento<input defaultValue={data.settings.openHours} /></label><label>Capacidade padrão<input type="number" defaultValue={data.settings.defaultCapacity} /></label><label className="checkLine"><input type="checkbox" defaultChecked={data.settings.emailNotifications} /> Enviar notificações de confirmação por e-mail</label></>}
            <div className="modalActions"><button className="primaryBtn">Salvar alterações</button></div>
          </form>
        </Panel>
        <Panel title="Acessos de teste">
          <div className="accessList">
            <p><b>Academia:</b> academia@demo.com / 123456</p>
            <p><b>Personal:</b> personal@demo.com / 123456</p>
            <p><b>Aluno:</b> aluno@demo.com / 123456</p>
          </div>
        </Panel>
      </div>
    )
  }

  function Toolbar({ hideStatus = false }: { hideStatus?: boolean }) {
    return (
      <div className="toolbar">
        <input className="searchInput" placeholder="Buscar por aula, aluno, personal, sala..." value={query} onChange={(event) => setQuery(event.target.value)} />
        {!hideStatus && <select className="selectInput" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos status</option><option value="open">Aberto</option><option value="full">Lotado</option><option value="cancelled">Cancelado</option><option value="done">Concluído</option></select>}
      </div>
    )
  }

  function Panel({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
    return <section className={`panel ${className}`}><header className="sectionHeader"><h2>{title}</h2>{action}</header>{children}</section>
  }

  function Metric({ label, value, hint }: { label: string; value: string | number; hint: string }) {
    return <article className="metricItem"><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>
  }

  function SessionCard({ session }: { session: Session }) {
    const trainer = trainerById(session.trainerId)
    const canReserve = currentUser?.role === 'student' && session.status === 'open'
    return (
      <article className="slotCard">
        <header><time>{timeLabel(session.startsAt)} - {timeLabel(session.endsAt)}</time><StatusBadge status={session.status} /></header>
        <h3>{session.title}</h3>
        <p>{session.kind} • {trainer?.name} • {session.room}</p>
        <Progress value={Math.round((session.bookedStudentIds.length / session.capacity) * 100)} label={`${session.bookedStudentIds.length}/${session.capacity} vagas`} />
        <div className="buttonGroup">
          {canReserve && <button className="primaryBtn compactBtn" onClick={() => reserveSession(session)}>Reservar</button>}
          {currentUser?.role !== 'student' && session.status !== 'cancelled' && <button className="dangerBtn compactBtn" onClick={() => updateSessionStatus(session.id, 'cancelled')}>Cancelar</button>}
          {currentUser?.role !== 'student' && session.status === 'cancelled' && <button className="secondaryBtn compactBtn" onClick={() => updateSessionStatus(session.id, 'open')}>Reabrir</button>}
          {currentUser?.role === 'trainer' && <button className="secondaryBtn compactBtn" onClick={() => updateSessionStatus(session.id, 'done')}>Concluir</button>}
        </div>
      </article>
    )
  }

  function SessionTable({ sessions, compact = false }: { sessions: Session[]; compact?: boolean }) {
    if (sessions.length === 0) return <div className="emptyState">Nenhum horário encontrado.</div>
    return (
      <div className="tableWrap"><table className="dataTable"><thead><tr><th>Aula / sessão</th><th>Data</th><th>Profissional</th><th>Vagas</th><th>Status</th><th>Ações</th></tr></thead><tbody>
        {sessions.map((session) => {
          const trainer = trainerById(session.trainerId)
          return <tr key={session.id}><td data-label="Aula / sessão"><strong>{session.title}</strong><small>{session.kind} • {session.room}</small></td><td data-label="Data">{brDateShort.format(new Date(session.startsAt))}<small>{timeLabel(session.startsAt)} - {timeLabel(session.endsAt)}</small></td><td data-label="Profissional">{trainer?.name}<small>{trainer?.specialty}</small></td><td data-label="Vagas"><Progress value={Math.round((session.bookedStudentIds.length / session.capacity) * 100)} label={`${session.bookedStudentIds.length}/${session.capacity}`} /></td><td data-label="Status"><StatusBadge status={session.status} /></td><td data-label="Ações"><div className="rowActions">{currentUser?.role === 'student' && <button className="primaryBtn compactBtn" disabled={session.status !== 'open'} onClick={() => reserveSession(session)}>Reservar</button>}{currentUser?.role !== 'student' && <><button className="secondaryBtn compactBtn" onClick={() => setSelectedDate(dateKey(new Date(session.startsAt)))}>Ver</button>{session.status !== 'cancelled' ? <button className="dangerBtn compactBtn" onClick={() => updateSessionStatus(session.id, 'cancelled')}>Cancelar</button> : <button className="secondaryBtn compactBtn" onClick={() => updateSessionStatus(session.id, 'open')}>Reabrir</button>}{!compact && <button className="linkBtn" onClick={() => deleteSession(session.id)}>Excluir</button>}</>}</div></td></tr>
        })}
      </tbody></table></div>
    )
  }

  function BookingTable({ bookings }: { bookings: Booking[] }) {
    if (bookings.length === 0) return <div className="emptyState">Nenhuma reserva encontrada.</div>
    return <div className="tableWrap"><table className="dataTable"><thead><tr><th>Aluno</th><th>Horário</th><th>Profissional</th><th>Status</th><th>Criado em</th><th>Ações</th></tr></thead><tbody>{bookings.map((booking) => {
      const session = sessionById(booking.sessionId)
      const student = studentById(booking.studentId)
      const trainer = session ? trainerById(session.trainerId) : undefined
      return <tr key={booking.id}><td data-label="Aluno"><strong>{student?.name}</strong><small>{student?.email}</small></td><td data-label="Horário"><strong>{session?.title}</strong><small>{session ? `${brDateShort.format(new Date(session.startsAt))} ${timeLabel(session.startsAt)}` : '-'}</small></td><td data-label="Profissional">{trainer?.name ?? '-'}</td><td data-label="Status"><StatusBadge status={booking.status} /></td><td data-label="Criado em">{brDateShort.format(new Date(booking.createdAt))}</td><td data-label="Ações">{booking.status !== 'cancelled' && <button className="dangerBtn compactBtn" onClick={() => cancelBooking(booking.id)}>Cancelar</button>}</td></tr>
    })}</tbody></table></div>
  }

  function StudentsTable({ students }: { students: Student[] }) {
    if (students.length === 0) return <div className="emptyState">Nenhum aluno vinculado ainda.</div>
    return <div className="tableWrap"><table className="dataTable"><thead><tr><th>Aluno</th><th>Plano</th><th>Objetivo</th><th>Créditos</th><th>Status</th><th>Contato</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td data-label="Aluno"><strong>{student.name}</strong><small>Desde {brDateShort.format(new Date(`${student.since}T00:00:00`))}</small></td><td data-label="Plano">{student.plan}</td><td data-label="Objetivo">{student.goal}</td><td data-label="Créditos">{student.credits}</td><td data-label="Status"><StatusBadge status={student.status} /></td><td data-label="Contato">{student.phone}<small>{student.email}</small></td></tr>)}</tbody></table></div>
  }

  function ActivityList() {
    return <div className="activityList">{notificationsForUser.map((item) => <article key={item.id} className="activityItem"><b>{item.title}</b><span>{item.message}</span><small>{brDateShort.format(new Date(item.createdAt))} às {timeLabel(item.createdAt)}</small></article>)}</div>
  }

  function StatusBadge({ status }: { status: string }) {
    const label: Record<string, string> = { active: 'Ativo', blocked: 'Bloqueado', open: 'Aberto', full: 'Lotado', cancelled: 'Cancelado', done: 'Concluído', confirmed: 'Confirmado', waiting: 'Espera' }
    return <span className={`statusBadge ${status}`}>{label[status] ?? status}</span>
  }

  function Progress({ value, label }: { value: number; label?: string }) {
    return <div className="progressBox"><div className="progressTop"><span>{label ?? `${value}%`}</span><b>{value}%</b></div><div className="bar"><i style={{ width: `${Math.min(100, value)}%` }} /></div></div>
  }

  function SessionModal() {
    const today = selectedDate || dateKey(new Date())
    return <ModalShell title="Novo horário / aula"><form className="formGrid" onSubmit={saveSession}>
      <label>Título<input name="title" required defaultValue={currentUser?.role === 'trainer' ? 'Personal disponível' : 'Nova aula'} /></label>
      <label>Tipo<select name="kind" defaultValue="Turma">{sessionKinds.map((kind) => <option key={kind}>{kind}</option>)}</select></label>
      {currentUser?.role === 'academy' && <label>Profissional<select name="trainerId" required>{data.trainers.filter((item) => item.status === 'active').map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}</select></label>}
      <label>Data<input type="date" name="date" required defaultValue={today} /></label>
      <label>Início<input type="time" name="start" required defaultValue="08:00" /></label>
      <label>Duração<select name="duration" defaultValue="60"><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label>
      <label>Capacidade<input type="number" min="1" name="capacity" defaultValue={currentUser?.role === 'trainer' ? 1 : data.settings.defaultCapacity} /></label>
      <label>Sala / local<input name="room" defaultValue={currentUser?.role === 'trainer' ? 'Box Personal' : 'Sala principal'} /></label>
      <label className="fullLine">Observações<input name="notes" placeholder="Ex.: levar toalha, aula para iniciantes..." /></label>
      <div className="modalActions"><button type="button" className="secondaryBtn" onClick={() => setModal(null)}>Cancelar</button><button className="primaryBtn">Salvar horário</button></div>
    </form></ModalShell>
  }

  function TrainerModal() {
    return <ModalShell title="Cadastrar personal"><form className="formGrid" onSubmit={saveTrainer}>
      <label>Nome<input name="name" required /></label><label>E-mail<input name="email" type="email" required /></label><label>Telefone<input name="phone" /></label><label>Especialidade<input name="specialty" required /></label><label>CREF<input name="cref" /></label><label className="fullLine">Bio<input name="bio" placeholder="Resumo profissional" /></label><div className="modalActions"><button type="button" className="secondaryBtn" onClick={() => setModal(null)}>Cancelar</button><button className="primaryBtn">Cadastrar</button></div>
    </form></ModalShell>
  }

  function StudentModal() {
    return <ModalShell title="Cadastrar aluno"><form className="formGrid" onSubmit={saveStudent}>
      <label>Nome<input name="name" required /></label><label>E-mail<input name="email" type="email" required /></label><label>Telefone<input name="phone" /></label><label>Plano<select name="plan">{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></label><label>Objetivo<input name="goal" defaultValue="Hipertrofia" /></label><label>Créditos<input type="number" name="credits" defaultValue="4" min="0" /></label><div className="modalActions"><button type="button" className="secondaryBtn" onClick={() => setModal(null)}>Cancelar</button><button className="primaryBtn">Cadastrar</button></div>
    </form></ModalShell>
  }

  function AvailabilityModal() {
    return <ModalShell title="Adicionar disponibilidade"><form className="formGrid" onSubmit={saveAvailability}>
      {currentUser?.role === 'academy' && <label>Profissional<select name="trainerId">{data.trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}</select></label>}<label>Dia<select name="day">{['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => <option key={day}>{day}</option>)}</select></label><label>Início<input type="time" name="start" defaultValue="08:00" /></label><label>Fim<input type="time" name="end" defaultValue="12:00" /></label><label className="fullLine">Serviço<input name="service" defaultValue="Personal / turma" /></label><div className="modalActions"><button type="button" className="secondaryBtn" onClick={() => setModal(null)}>Cancelar</button><button className="primaryBtn">Adicionar</button></div>
    </form></ModalShell>
  }

  function ModalShell({ title, children }: { title: string; children: React.ReactNode }) {
    return <div className="modalOverlay"><div className="modalBox"><header className="modalHeader"><h2>{title}</h2><button onClick={() => setModal(null)}>×</button></header>{children}</div></div>
  }
}

function LoginScreen({ onLogin, onQuickLogin, onReset }: { onLogin: (email: string, password: string) => void; onQuickLogin: (role: Role) => void; onReset: () => void }) {
  const [email, setEmail] = useState('academia@demo.com')
  const [password, setPassword] = useState('123456')
  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="loginBrand"><div className="brandMark">F</div><div><b>FitAgenda</b><span>SaaS de agendamento para academias e personal trainers</span></div></div>
        <h1>Demo navegável com 3 painéis reais</h1>
        <p>Entre como academia, personal ou aluno. A experiência muda de acordo com o perfil e os dados ficam salvos no navegador.</p>
        <form className="loginForm" onSubmit={(event) => { event.preventDefault(); onLogin(email, password) }}>
          <label>E-mail<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Senha<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
          <button className="primaryBtn">Entrar</button>
        </form>
        <div className="demoAccess">
          <button onClick={() => onQuickLogin('academy')}>Entrar como Academia</button>
          <button onClick={() => onQuickLogin('trainer')}>Entrar como Personal</button>
          <button onClick={() => onQuickLogin('student')}>Entrar como Aluno</button>
        </div>
        <button className="linkBtn" onClick={onReset}>Resetar dados da demo</button>
      </section>
      <section className="loginPreview">
        <div className="previewHeader"><span>Hoje</span><b>Operação em tempo real</b></div>
        <div className="previewRows">
          <p><b>Academia</b><span>Gerencia usuários, profissionais, horários, reservas e relatórios.</span></p>
          <p><b>Personal</b><span>Vê somente a própria agenda, alunos, sessões e disponibilidade.</span></p>
          <p><b>Aluno</b><span>Reserva aulas, cancela horários e acompanha treino/agenda.</span></p>
        </div>
      </section>
    </main>
  )
}

function titleForView(view: View, role: Role) {
  const title: Record<View, string> = {
    dashboard: role === 'student' ? 'Início do aluno' : 'Painel operacional',
    calendar: role === 'trainer' ? 'Minha agenda' : 'Calendário de agendamentos',
    sessions: role === 'trainer' ? 'Sessões do personal' : 'Aulas e horários',
    bookings: 'Agendamentos',
    users: 'Usuários e alunos',
    professionals: role === 'student' ? 'Personais disponíveis' : 'Profissionais',
    reports: 'Relatórios',
    settings: role === 'academy' ? 'Configurações' : 'Perfil',
    students: 'Meus alunos',
    availability: 'Disponibilidade',
    myBookings: 'Minhas reservas',
    workout: 'Meu treino',
    marketplace: 'Reservar horário',
  }
  return title[view]
}

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const cell = new Date(start)
    cell.setDate(start.getDate() + index)
    return cell
  })
}

function moveMonth(month: Date, amount: number) {
  const copy = new Date(month)
  copy.setMonth(copy.getMonth() + amount)
  return copy
}

function uniqueStudentIds(sessions: Session[]) {
  return Array.from(new Set(sessions.flatMap((session) => session.bookedStudentIds)))
}
