import type { User, Student, Teacher, Role } from '@prisma/client'

export type UserWithRole       = User & { role: Role }
export type StudentWithUser    = Student & { user: User }
export type TeacherWithUser    = Teacher & { user: User }

export type ServerActionResponse<T = void> =
  | { success: true;  data: T }
  | { success: false; error: string }
