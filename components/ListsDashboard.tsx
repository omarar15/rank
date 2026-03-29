'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { CreateListForm } from './CreateListForm'
import { ListDoc } from '@/lib/types'

interface ListEntry {
  id: string
  data: ListDoc
}

export function ListsDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [lists, setLists] = useState<ListEntry[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'lists'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, data: d.data() as ListDoc })))
    })
    return unsub
  }, [user])

  if (loading || !user) {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">Loading…</div>
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">My lists</h1>
        <button
          onClick={() => signOut(auth).then(() => router.push('/auth'))}
          className="text-sm text-zinc-400 underline"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6">
        <CreateListForm ownerId={user.uid} />
      </div>

      {lists.length === 0 ? (
        <p className="text-center text-sm text-zinc-400">No lists yet. Create one above.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lists.map(({ id, data }) => (
            <li key={id}>
              <Link
                href={`/lists/${id}`}
                className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white px-4 py-4 shadow-sm active:bg-zinc-50"
              >
                <span className="font-medium">{data.title}</span>
                <span className="text-sm text-zinc-400">
                  {data.rankedItems.length} ranked
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
