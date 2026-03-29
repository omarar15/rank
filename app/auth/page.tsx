import type { Metadata } from 'next'
import { PhoneAuthForm } from '@/components/PhoneAuthForm'

export const metadata: Metadata = { title: 'Sign in — rank' }

export default function AuthPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">rank</h1>
        <PhoneAuthForm />
      </div>
    </main>
  )
}
