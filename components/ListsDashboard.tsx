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
  const [listsLoading, setListsLoading] = useState(true)

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
      setListsLoading(false)
    })
    return unsub
  }, [user])

  if (loading || !user) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-stone-100" />
          <div className="h-4 w-16 animate-pulse rounded bg-stone-100" />
        </div>
        <div className="mb-6 h-10 animate-pulse rounded-xl bg-stone-100" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">My lists</h1>
        <button
          onClick={() => signOut(auth).then(() => router.push('/auth'))}
          className="text-sm text-stone-400 underline"
        >
          Sign out
        </button>
      </div>

      <div className="mb-6">
        <CreateListForm ownerId={user.uid} />
      </div>

      {listsLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <p className="text-center text-sm text-stone-400">No lists yet. Create one above.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lists.map(({ id, data }) => (
            <li key={id}>
              <Link
                href={`/lists/${id}`}
                className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-4 shadow-sm active:bg-stone-50"
              >
                <span className="font-medium">{data.title}</span>
                <span className="text-sm text-stone-400">
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
