import { requireAuth } from '@/lib/auth-utils'
import { ROLES, ROLE_LABELS, ROLE_NAV } from '@/lib/roles'
import { Role } from '@prisma/client'
import { APP_NAME } from '@/lib/constants'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { SidebarNav } from '@/components/layout/SidebarNav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, User as UserIcon, LogOut, ChevronUp } from 'lucide-react'
import Link from 'next/link'

import { SuspensionGuard } from '@/components/layout/SuspensionGuard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionUser = await requireAuth()
  const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } })
  const user = dbUser || sessionUser

  const role = user.role as Role
  const navItems = ROLE_NAV[role] || []
  const roleLabel = ROLE_LABELS[role] || 'User'
  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const school = user.schoolId
    ? await prisma.school.findUnique({
        where: { id: user.schoolId },
        select: { name: true, logo: true },
      })
    : null

  const schoolInitial = school?.name?.[0]?.toUpperCase() ?? 'K'

  let isSuspended = false
  let suspensionReason: string | null = null

  if (role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { suspensions: { where: { status: 'APPROVED' }, take: 1 } }
    })
    if (student?.suspensions.length) {
      isSuspended = true
      suspensionReason = student.suspensions[0].reason
    }
  } else if (role === 'PARENT') {
    const parent = await prisma.parent.findUnique({
      where: { userId: user.id },
      include: {
        children: {
          include: { suspensions: { where: { status: 'APPROVED' }, take: 1 } }
        }
      }
    })
    if (parent) {
      const suspendedChild = parent.children.find(c => c.suspensions.length > 0)
      if (suspendedChild) {
        isSuspended = true
        suspensionReason = suspendedChild.suspensions[0].reason
      }
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-sidebar-border bg-sidebar" style={{ width: '240px' }}>

          {/* Header */}
          <SidebarHeader className="px-4 py-4 bg-sidebar">
            <div className="flex items-center gap-2.5">
              {school?.logo ? (
                <Image
                  src={school.logo}
                  alt={school.name}
                  width={24}
                  height={24}
                  className="rounded w-6 h-6 object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary-foreground">{schoolInitial}</span>
                </div>
              )}
              <div className="flex items-center">
                <Image src="/darklogo.png" alt={APP_NAME} width={80} height={20} className="object-contain dark:hidden" />
                <Image src="/lightlogo.png" alt={APP_NAME} width={80} height={20} className="object-contain hidden dark:block" />
              </div>
            </div>
            <div className="mt-3 h-px bg-sidebar-border" />
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent className="bg-sidebar pt-1">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarNav items={navItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-2 border-t border-sidebar-border bg-sidebar">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full outline-none">
                <div className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors group">
                  <Avatar className="h-8 w-8 rounded-md">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground rounded-md">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">
                      {roleLabel}
                    </span>
                  </div>
                  <ChevronUp className="w-4 h-4 text-sidebar-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2 rounded-xl" align="start" side="top">
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 my-0.5">
                  <Link href="/account" className="flex items-center gap-2 w-full p-2">
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                
                {(role === 'PRINCIPAL' || role === 'REGISTRAR') && (
                  <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 my-0.5">
                    <Link href="/settings" className="flex items-center gap-2 w-full p-2">
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="my-1 mx-1" />
                
                <DropdownMenuItem className="cursor-pointer rounded-lg mx-1 my-0.5 text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Link href="/api/auth/signout" className="flex items-center gap-2 w-full p-2">
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex items-center h-12 px-4 border-b border-sidebar-border bg-sidebar md:hidden">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6 md:p-8 bg-background animate-in fade-in duration-300">
            <SuspensionGuard isSuspended={isSuspended} reason={suspensionReason}>
              {children}
            </SuspensionGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
