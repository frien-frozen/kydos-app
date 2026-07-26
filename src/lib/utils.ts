import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { GRADE_CATEGORIES } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function computeGrade(entry: {
  quiz1?: number | null; quiz2?: number | null; quiz3?: number | null
  quiz4?: number | null; quiz5?: number | null
  summative1?: number | null; summative2?: number | null; summative3?: number | null
  summative4?: number | null; summative5?: number | null
  portfolio?: number | null; finalExam?: number | null
}): number | null {
  const avg = (vals: (number | null | undefined)[]) => {
    const clean = vals.filter((v): v is number => v !== null && v !== undefined)
    return clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null
  }
  const quizAvg = avg([entry.quiz1, entry.quiz2, entry.quiz3, entry.quiz4, entry.quiz5])
  const summAvg = avg([entry.summative1, entry.summative2, entry.summative3, entry.summative4, entry.summative5])
  const port = entry.portfolio ?? null
  const fin  = entry.finalExam ?? null
  if (!quizAvg && !summAvg && !port && !fin) return null
  const score =
    (quizAvg ?? 0) * GRADE_CATEGORIES.quizzes.weight +
    (summAvg  ?? 0) * GRADE_CATEGORIES.summative.weight +
    (port     ?? 0) * GRADE_CATEGORIES.portfolio.weight +
    (fin      ?? 0) * GRADE_CATEGORIES.finalExam.weight
  return Math.round(score * 10) / 10
}

export function gradeStatus(grade: number | null): 'excellent' | 'good' | 'fair' | 'failing' | 'none' {
  if (!grade) return 'none'
  if (grade >= 90) return 'excellent'
  if (grade >= 80) return 'good'
  if (grade >= 75) return 'fair'
  return 'failing'
}
