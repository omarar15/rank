'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { AddItemForm } from './AddItemForm'
import { deleteItem } from '@/lib/firestore'
import { ListDoc, ItemDoc } from '@/lib/types'

interface ItemEntry {
  id: string
  data: ItemDoc
}

interface Props {
  listId: string
}

export function ListDetail({ listId }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [listData, setListData] = useState<ListDoc | null>(null)
  const [items, setItems] = useState<ItemEntry[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'lists', listId), (snap) => {
      if (snap.exists()) setListData(snap.data() as ListDoc)
      setListLoading(false)
    })
    return unsub
  }, [listId, user])

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(collection(db, 'lists', listId, 'items'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, data: d.data() as ItemDoc })))
      setItemsLoading(false)
    })
    return unsub
  }, [listId, user])

  if (loading || listLoading) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
          <div className="h-7 flex-1 animate-pulse rounded-lg bg-zinc-100" />
          <div className="h-4 w-12 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="mb-8 h-10 animate-pulse rounded-xl bg-zinc-100" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      </main>
    )
  }

  if (!listData) {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">List not found.</div>
  }

  const rankedIds = listData.rankedItems
  const rankedItems = rankedIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ItemEntry => i !== undefined)
  const unrankedItems = items.filter((i) => !rankedIds.includes(i.id))

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${listData.shareToken}`
    : ''

  function handleDelete(itemId: string) {
    deleteItem(listId, itemId)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/lists" className="text-sm text-zinc-400">← Lists</Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight">{listData.title}</h1>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
            copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
          }}
          className="text-sm text-zinc-400 underline"
        >
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      <div className="mb-8">
        <AddItemForm listId={listId} existingNames={items.map((i) => i.data.name)} />
      </div>

      {rankedItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Ranked</h2>
          <ol className="flex flex-col gap-2">
            {rankedItems.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                <span className="w-6 text-right text-sm font-bold text-zinc-300">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{item.data.name}</span>
                <Link
                  href={`/lists/${listId}/rank/${item.id}`}
                  className="text-xs text-zinc-400 underline"
                >
                  Re-rank
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-400 underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      {unrankedItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Unranked</h2>
          <ul className="flex flex-col gap-2">
            {unrankedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                <span className="flex-1 text-sm font-medium">{item.data.name}</span>
                <Link
                  href={`/lists/${listId}/rank/${item.id}`}
                  className="text-xs font-medium text-zinc-900 underline"
                >
                  Rank
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-xs text-red-400 underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {itemsLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : rankedItems.length === 0 && unrankedItems.length === 0 ? (
        <p className="text-center text-sm text-zinc-400">Add items above to get started.</p>
      ) : null}
    </main>
  )
}
