'use client'

import { useState } from 'react'
import { loginWithCredentials } from '@/server/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    const result = await loginWithCredentials(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
        <Input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="admin@kydos.test" 
          required 
          className="h-10 border-border bg-background focus-visible:ring-muted-foreground"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          placeholder="••••••••" 
          required 
          className="h-10 border-border bg-background focus-visible:ring-muted-foreground"
        />
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <Button 
        type="submit" 
        className="w-full h-11 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
