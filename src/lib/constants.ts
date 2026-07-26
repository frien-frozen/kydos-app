export const APP_NAME    = 'Kydos'
export const APP_TAGLINE = 'School management, done right.'

export const GRADE_CATEGORIES = {
  quizzes:   { label: 'Quizzes',          count: 5, weight: 0.20 },
  summative: { label: 'Summative Tests',  count: 5, weight: 0.40 },
  portfolio: { label: 'Portfolio',        count: 1, weight: 0.20 },
  finalExam: { label: 'Final Exam',       count: 1, weight: 0.20 },
} as const

export const BILLING_REMINDER_DAYS = [7, 2] as const
export const CURRENCY = 'PHP' as const
