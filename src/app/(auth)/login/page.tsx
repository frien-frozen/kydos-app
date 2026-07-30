import { signIn } from '@/lib/auth'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-background"
    >
      <div style={{ animation: 'card-enter 0.4s ease both' }} className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(0,0,0,0.06)] px-8 py-10">

          {/* Wordmark */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-1.5">
              <Image src="/darklogo.png" alt="" width={24} height={24} className="w-6 h-6 object-contain dark:hidden" />
              <Image src="/lightlogo.png" alt="" width={24} height={24} className="w-6 h-6 object-contain hidden dark:block" />
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-7" />

          {/* Credentials Form */}
          <LoginForm />
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google sign-in */}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/dashboard' })
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full gap-2.5 h-11 text-sm font-medium border-border hover:bg-accent text-foreground hover:text-foreground transition-colors duration-150 rounded-lg"
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-7 text-center text-xs text-muted-foreground">
            For school administrators and students
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
