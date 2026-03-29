'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { AddItemForm } from './AddItemForm'
import { deleteItem } from '@/lib/firestore'
import { Copy, Check, ArrowLeft } from 'lucide-react'
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
  const [listData, setListData] = useState<ListDoc | null>(null)
  const [items, setItems] = useState<ItemEntry[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'lists', listId), (snap) => {
      if (snap.exists()) setListData(snap.data() as ListDoc)
      else setListData(null)
      setListLoading(false)
    })
    return unsub
  }, [listId])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lists', listId, 'items'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, data: d.data() as ItemDoc })))
      setItemsLoading(false)
    })
    return unsub
  }, [listId])

  if (loading || listLoading) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-4 w-12 animate-pulse rounded bg-stone-100" />
          <div className="h-7 flex-1 animate-pulse rounded-lg bg-stone-100" />
          <div className="h-4 w-12 animate-pulse rounded bg-stone-100" />
        </div>
        <div className="mb-8 h-10 animate-pulse rounded-xl bg-stone-100" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      </main>
    )
  }

  if (!listData) {
    return <div className="flex min-h-dvh items-center justify-center text-stone-400">List not found.</div>
  }

  const isOwner = user?.uid === listData.ownerId

  const rankedIds = listData.rankedItems
  const rankedItems = rankedIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is ItemEntry => i !== undefined)
  const unrankedItems = items.filter((i) => !rankedIds.includes(i.id))

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }

  if (!isOwner) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="flex-1 text-xl font-semibold tracking-tight">{listData.title}</h1>
          <Link href="/auth" className="text-sm text-stone-400 underline">Sign in</Link>
        </div>

        {itemsLoading ? (
          <p className="text-center text-sm text-stone-400">Loading…</p>
        ) : rankedItems.length === 0 ? (
          <p className="text-center text-sm text-stone-400">No ranked items yet.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {rankedItems.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
                <span className="w-6 text-right text-sm font-bold text-stone-300">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{item.data.name}</span>
              </li>
            ))}
          </ol>
        )}
      </main>
    )
  }

  function handleDelete(itemId: string) {
    deleteItem(listId, itemId)
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/lists" className="rounded-md p-2.5 text-stone-400 pointer-hover:hover:bg-stone-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-center text-xl font-semibold tracking-tight">{listData.title}</h1>
        <button onClick={handleCopy} className="rounded-md p-2.5 text-stone-400 pointer-hover:hover:bg-stone-100">
          {copied ? <Check className="h-4 w-4 text-green-700" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mb-8">
        <AddItemForm listId={listId} existingNames={items.map((i) => i.data.name)} />
      </div>

      {rankedItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Ranked</h2>
          <ol className="flex flex-col gap-2">
            {rankedItems.map((item, i) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
                <span className="w-6 text-right text-sm font-bold text-stone-300">{i + 1}</span>
                <span className="flex-1 text-sm font-medium">{item.data.name}</span>
                <Link
                  href={`/lists/${listId}/rank/${item.id}`}
                  className="text-xs text-stone-400 underline"
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
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Unranked</h2>
          <ul className="flex flex-col gap-2">
            {unrankedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
                <span className="flex-1 text-sm font-medium">{item.data.name}</span>
                <Link
                  href={`/lists/${listId}/rank/${item.id}`}
                  className="text-xs font-medium text-stone-900 underline"
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
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : rankedItems.length === 0 && unrankedItems.length === 0 ? (
        <p className="text-center text-sm text-stone-400">Add items above to get started.</p>
      ) : null}
    </main>
  )
}
