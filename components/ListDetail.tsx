'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { AddItemForm } from './AddItemForm'
import { deleteItem, setRankedItems } from '@/lib/firestore'
import { Copy, Check, ArrowLeft, Trash2, GripVertical } from 'lucide-react'
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
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStartYRef = useRef(0)
  const dragItemTopRef = useRef(0)
  const listRef = useRef<HTMLOListElement>(null)

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

  function getItemHeight(): number {
    if (!listRef.current) return 0
    const first = listRef.current.children[0] as HTMLElement | undefined
    if (!first) return 0
    return first.offsetHeight + 8 // gap-2
  }

  function getOverIndex(draggedIdx: number, currentDragY: number): number {
    const h = getItemHeight()
    if (h === 0) return draggedIdx
    const offset = Math.round(currentDragY / h)
    const target = draggedIdx + offset
    return Math.max(0, Math.min(rankedItems.length - 1, target))
  }

  function handleGripDown(e: React.PointerEvent, i: number) {
    e.preventDefault()
    const el = (e.target as HTMLElement).closest('li') as HTMLElement
    if (!el) return
    el.setPointerCapture(e.pointerId)
    dragStartYRef.current = e.clientY
    dragItemTopRef.current = el.getBoundingClientRect().top
    setDragIndex(i)
    setDragY(0)
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (dragIndex === null) return
    const dy = e.clientY - dragStartYRef.current
    setDragY(dy)
  }

  function handlePointerUp() {
    if (dragIndex === null || !listData) {
      setDragIndex(null)
      setDragY(0)
      setDragging(false)
      return
    }
    const target = getOverIndex(dragIndex, dragY)
    if (target !== dragIndex) {
      const newRanked = [...listData.rankedItems]
      const [moved] = newRanked.splice(dragIndex, 1)
      newRanked.splice(target, 0, moved)
      setListData({ ...listData, rankedItems: newRanked })
      setRankedItems(listId, newRanked)
    }
    setDragging(false)
    setDragIndex(null)
    setDragY(0)
  }

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
        <Link href="/lists" className="rounded-lg p-2.5 text-stone-400 pointer-hover:hover:bg-stone-100 pointer-hover:hover:text-stone-600">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-center text-xl font-semibold tracking-tight">{listData.title}</h1>
        <button onClick={handleCopy} className="rounded-lg p-2.5 text-stone-400 pointer-hover:hover:bg-stone-100 pointer-hover:hover:text-stone-600">
          {copied ? <Check className="h-4 w-4 text-green-700" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <div className="mb-8">
        <AddItemForm listId={listId} existingNames={items.map((i) => i.data.name)} />
      </div>

      {rankedItems.length > 0 && (() => {
        const target = dragIndex !== null ? getOverIndex(dragIndex, dragY) : null
        const h = getItemHeight()

        function getTranslateY(i: number): number {
          if (dragIndex === null || target === null) return 0
          if (i === dragIndex) return dragY
          if (dragIndex < target && i > dragIndex && i <= target) return -h
          if (dragIndex > target && i < dragIndex && i >= target) return h
          return 0
        }

        return (
          <section className="mb-8">
            <ol ref={listRef} className="flex flex-col gap-2">
              {rankedItems.map((item, i) => {
                const ty = getTranslateY(i)
                const isDragged = dragIndex === i

                return (
                  <li
                    key={item.id}
                    onPointerMove={isDragged ? handlePointerMove : undefined}
                    onPointerUp={isDragged ? handlePointerUp : undefined}
                    style={{
                      transform: `translateY(${ty}px)`,
                      zIndex: isDragged ? 50 : 0,
                    }}
                    className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm ${
                      isDragged
                        ? 'scale-[1.02] border-stone-300 shadow-md'
                        : `border-stone-100${dragging ? ' transition-transform duration-200' : ''}`
                    }`}
                  >
                    <span
                      className="touch-none cursor-grab text-stone-300 select-none active:cursor-grabbing"
                      onPointerDown={(e) => handleGripDown(e, i)}
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <span className="w-6 text-right text-sm font-bold text-stone-300">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium">{item.data.name}</span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-stone-400 pointer-hover:hover:bg-red-50 pointer-hover:hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })()}

      {unrankedItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-center text-stone-400">Unranked</h2>
          <ul className="flex flex-col gap-2">
            {unrankedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex w-[calc(16px+24px+12px)] items-center">
                  <Link
                    href={`/lists/${listId}/rank/${item.id}`}
                    className="rounded-lg px-2 py-[3px] text-stone-400 pointer-hover:hover:bg-stone-100 pointer-hover:hover:text-stone-600"
                  >
                    <span className="text-sm font-medium">Rank</span>
                  </Link>
                </div>
                <span className="flex-1 text-sm font-medium">{item.data.name}</span>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded-lg p-2 text-stone-400 pointer-hover:hover:bg-red-50 pointer-hover:hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
