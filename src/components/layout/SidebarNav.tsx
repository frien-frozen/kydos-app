'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

interface NavItem {
  label: string
  href: string
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <SidebarMenu>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              className={
                active
                  ? 'text-sm font-medium text-foreground bg-accent rounded-md transition-colors duration-150'
                  : 'text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors duration-150'
              }
            >
              {item.label}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
