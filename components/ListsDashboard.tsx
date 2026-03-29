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
import { ListDoc, ListColor, ItemDoc } from '@/lib/types'
import { ColorPicker } from './ColorPicker'

const COLOR_GRADIENT: Record<ListColor, string> = {
  red: 'rgba(239,68,68,0.15)',
  orange: 'rgba(249,115,22,0.15)',
  yellow: 'rgba(234,179,8,0.15)',
  green: 'rgba(34,197,94,0.15)',
  sky: 'rgba(14,165,233,0.15)',
  violet: 'rgba(139,92,246,0.15)',
  pink: 'rgba(236,72,153,0.15)',
  white: 'rgba(0,0,0,0)',
}

interface ListEntry {
  id: string
  data: ListDoc
}

function ListCard({ id, data }: ListEntry) {
  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lists', id, 'items'), (snap) => {
      const map = new Map<string, string>()
      snap.docs.forEach((d) => map.set(d.id, (d.data() as ItemDoc).name))
      setItemNames(map)
    })
    return unsub
  }, [id])

  const rankedNames = data.rankedItems
    .map((itemId) => itemNames.get(itemId))
    .filter((n): n is string => n !== undefined)
    .slice(0, 5)

  return (
    <Link
      href={`/lists/${id}`}
      className="flex overflow-hidden rounded-2xl bg-white p-4 shadow-md active:bg-stone-50 ring ring-black/5"
      style={{ backgroundImage: `linear-gradient(to bottom right, ${COLOR_GRADIENT[(data.color as ListColor) || 'white']}, white 70%)` }}
    >
      <span className="mb-3 font-medium flex-3">{data.title}</span>
      <ol
        className="flex flex-2 flex-col gap-0.5 text-sm text-stone-500/50 min-h-[108px]"
        style={{ maskImage: 'linear-gradient(to bottom, black 40%, transparent)' }}
      >
        {rankedNames.map((name, i) => (
          <li key={i} className="flex gap-1.5 truncate">
            <span className="tabular-nums">{i + 1}.</span>
            <span className="truncate">{name}</span>
          </li>
        ))}
      </ol>
    </Link>
  )
}

export function ListsDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [lists, setLists] = useState<ListEntry[]>([])
  const [listsLoading, setListsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newColor, setNewColor] = useState<ListColor>('white')
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
          <div className="h-7 w-24 animate-pulse rounded-lg bg-black/5" />
          <div className="h-4 w-16 animate-pulse rounded bg-black/5" />
        </div>
        <div className="mb-6 h-10 animate-pulse rounded-xl bg-black/5" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => signOut(auth).then(() => router.push('/auth'))}
          className="rounded-full p-2.5 text-stone-400 pointer-hover:hover:bg-stone-100 pointer-hover:hover:text-stone-600"
        >
          <LogOut className="h-4 w-4 -scale-x-100" />
        </button>
        <h1 className="flex-1 text-center text-xl font-semibold tracking-tight">My Lists</h1>
        <button
          onClick={() => {
            setShowCreate(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }}
          className="rounded-full bg-stone-200/60 p-2.5 text-stone-500 pointer-hover:hover:bg-stone-200 pointer-hover:hover:text-stone-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-32" onClick={() => { setShowCreate(false); setNewTitle(''); setNewColor('white') }}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              if (!newTitle.trim()) return
              const listId = createList(user.uid, newTitle.trim(), newColor)
              setShowCreate(false)
              setNewTitle('')
              setNewColor('white')
              router.push(`/lists/${listId}`)
            }}
            className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white p-4 shadow-lg"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-stone-400">Name</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="List name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base outline-none focus:border-stone-400"
                required
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-stone-400">Color</span>
              <ColorPicker value={newColor} onChange={setNewColor} columns={8} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewTitle(''); setNewColor('white') }}
                className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="flex-1 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
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
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="flex flex-1 max-h-64 flex-col items-center justify-center text-black/40">
          <p className="text-sm font-medium">No lists yet</p>
          <p className="mt-1 text-xs">Tap the + button to create one</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lists.map(({ id, data }) => (
            <li key={id}>
              <ListCard id={id} data={data} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
