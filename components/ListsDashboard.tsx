'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { createList } from '@/lib/firestore'
import { LogOut, Plus } from 'lucide-react'
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
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => signOut(auth).then(() => router.push('/auth'))}
          className="rounded-lg p-2.5 text-stone-400 pointer-hover:hover:bg-stone-100 pointer-hover:hover:text-stone-600"
        >
          <LogOut className="h-4 w-4 -scale-x-100" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold tracking-tight">My lists</h1>
        <button
          onClick={() => {
            setShowCreate(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          className="rounded-lg bg-stone-900 p-2.5 text-white pointer-hover:hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-32" onClick={() => { setShowCreate(false); setNewTitle('') }}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              if (!newTitle.trim()) return
              const listId = createList(user.uid, newTitle.trim())
              setShowCreate(false)
              setNewTitle('')
              router.push(`/lists/${listId}`)
            }}
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="New list name…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base outline-none focus:border-stone-400"
              required
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewTitle('') }}
                className="rounded-xl px-4 py-2 text-sm text-stone-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {listsLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <p className="text-center text-sm text-stone-400">No lists yet. Tap + to create one.</p>
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
