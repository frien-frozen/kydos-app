'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UploadButton } from '@/utils/uploadthing'
import { updateUserProfile } from '@/server/settings'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface Props {
  user: UserData
}

export function AccountForm({ user }: Props) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(user.name ?? '')
  const [nameError, setNameError] = useState('')
  const [image, setImage] = useState(user.image)
  const [pending, startTransition] = useTransition()

  const initials = (user.name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleSaveName() {
    setNameError('')
    const words = name.trim().split(' ').filter(Boolean)
    if (words.length < 2) {
      setNameError('Please enter your full name (first and last)')
      return
    }
    startTransition(async () => {
      const result = await updateUserProfile({ name: name.trim() })
      if (result.success) {
        toast.success('Name updated')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update name')
      }
    })
  }

  function handleImageUpload(url: string) {
    setImage(url)
    startTransition(async () => {
      const result = await updateUserProfile({ image: url })
      if (result.success) {
        toast.success('Photo updated')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to update photo')
        setImage(user.image)
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* Profile */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={image ?? undefined} alt={user.name ?? ''} />
            <AvatarFallback className="text-base bg-muted text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <UploadButton
              endpoint="profilePicture"
              onClientUploadComplete={(res) => {
                const url = res[0]?.url
                if (url) handleImageUpload(url)
              }}
              onUploadError={(err) => { toast.error(err.message) }}
              appearance={{
                button: 'bg-muted border border-border !text-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors ut-readying:bg-muted ut-uploading:bg-muted',
                allowedContent: 'hidden',
              }}
              content={{ button: 'Upload photo' }}
            />
            <p className="text-xs text-muted-foreground">JPG or PNG, max 2MB</p>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5 max-w-sm">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display name</Label>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setNameError('') }}
            placeholder="First Last"
            onKeyDown={e => { if (e.key === 'Enter') handleSaveName() }}
          />
          {nameError && <p className="text-xs text-red-600">{nameError}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5 max-w-sm">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</Label>
          <p className="text-sm text-foreground py-2">{user.email}</p>
          <p className="text-xs text-muted-foreground">Connected via Google. Email cannot be changed.</p>
        </div>

        <button
          onClick={handleSaveName}
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {pending ? 'Saving…' : 'Save profile'}
        </button>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Appearance</h2>
        <div>
          <p className="text-xs text-muted-foreground mb-3">Choose your preferred color theme.</p>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer capitalize',
                  theme === t
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Danger zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Sign out of your account</p>
            <p className="text-xs text-muted-foreground">You will be redirected to the login page.</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-destructive hover:text-destructive transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </section>

    </div>
  )
}
