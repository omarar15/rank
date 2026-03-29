'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { PhoneAuthForm } from '@/components/PhoneAuthForm'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/lists')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight">rank</h1>
          <p className="mt-2 text-stone-400">rank anything, instantly</p>
        </div>
        <PhoneAuthForm />
      </div>
    </main>
  )
}
