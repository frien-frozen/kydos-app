import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { AccountForm } from '@/components/account/AccountForm'

export default async function AccountPage() {
  const sessionUser = await requireAuth()
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } })
  if (!user) return null

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      <AccountForm
        user={{
          id:    user.id,
          name:  user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
        }}
      />
    </div>
  )
}
