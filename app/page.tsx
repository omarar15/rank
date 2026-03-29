'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/lists')
    }
  }, [user, loading, router])

  if (loading) return null

  if (user) return null

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-4xl font-bold tracking-tight">rank</h1>
      <p className="mb-8 max-w-xs text-stone-500">
        Create ranked lists using a simple comparison flow.
      </p>
      <Link
        href="/auth"
        className="rounded-2xl bg-stone-900 px-8 py-3 font-semibold text-white"
      >
        Get started
      </Link>
    </main>
  )
}
