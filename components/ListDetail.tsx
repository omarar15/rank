'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { doc, collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { AddItemForm } from './AddItemForm'
import { deleteItem, deleteList, setRankedItems, updateListColor } from '@/lib/firestore'
import { Link2, Check, ArrowLeft, Trash2, GripVertical, Plus, EllipsisVertical } from 'lucide-react'
import { ListDoc, ItemDoc, ListColor } from '@/lib/types'
import { ColorPicker } from './ColorPicker'

const COLOR_BG: Record<ListColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
  white: 'bg-stone-800',
}

const COLOR_TEXT: Record<ListColor, string> = {
  red: 'text-red-600 pointer-hover:hover:bg-red-50 pointer-hover:hover:text-red-700',
  orange: 'text-orange-600 pointer-hover:hover:bg-orange-50 pointer-hover:hover:text-orange-700',
  yellow: 'text-yellow-600 pointer-hover:hover:bg-yellow-50 pointer-hover:hover:text-yellow-700',
  green: 'text-green-600 pointer-hover:hover:bg-green-50 pointer-hover:hover:text-green-700',
  sky: 'text-sky-600 pointer-hover:hover:bg-sky-50 pointer-hover:hover:text-sky-700',
  violet: 'text-violet-600 pointer-hover:hover:bg-violet-50 pointer-hover:hover:text-violet-700',
  pink: 'text-pink-600 pointer-hover:hover:bg-pink-50 pointer-hover:hover:text-pink-700',
  white: 'text-black/50 pointer-hover:hover:bg-black/5 pointer-hover:hover:text-black/80',
}

const COLOR_GRADIENT: Record<ListColor, string> = {
  red: 'rgba(239,68,68,0.3)',
  orange: 'rgba(249,115,22,0.3)',
  yellow: 'rgba(234,179,8,0.3)',
  green: 'rgba(34,197,94,0.3)',
  sky: 'rgba(14,165,233,0.3)',
  violet: 'rgba(139,92,246,0.3)',
  pink: 'rgba(236,72,153,0.3)',
  white: 'rgba(0,0,0,0)',
}

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
  const [showAdd, setShowAdd] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
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
    const color = (listData?.color as ListColor) || 'white'
    const gradient = `linear-gradient(to bottom, ${COLOR_GRADIENT[color]}, transparent)`
    document.documentElement.style.background = gradient
    return () => { document.documentElement.style.background = '' }
  }, [listData?.color])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'lists', listId, 'items'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, data: d.data() as ItemDoc })))
      setItemsLoading(false)
    })
    return unsub
  }, [listId])

  useEffect(() => {
    if (!showMenu) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('pointerdown', onClickOutside)
    return () => document.removeEventListener('pointerdown', onClickOutside)
  }, [showMenu])

  if (loading || listLoading) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-4 w-12 animate-pulse rounded bg-black/5" />
          <div className="h-7 flex-1 animate-pulse rounded-lg bg-black/5" />
          <div className="h-4 w-12 animate-pulse rounded bg-black/5" />
        </div>
        <div className="mb-8 h-10 animate-pulse rounded-xl bg-black/5" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-black/5" />
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
              <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/lists" className="rounded-lg p-2.5 text-black/40 pointer-hover:hover:bg-black/5 pointer-hover:hover:text-black/70">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight">{listData.title}</h1>
        <div className="flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2.5 text-black/40 pointer-hover:hover:bg-black/5 pointer-hover:hover:text-black/70"
            >
              <EllipsisVertical className="h-4 w-4 rotate-90" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-34 rounded-xl bg-white shadow-lg ring-1 ring-black/10 px-3 py-2 gap-1.5 flex flex-col">
                <div className="pb-2 pt-1">
                  <p className="mb-2 text-xs font-medium text-black/40">Color</p>
                  <ColorPicker
                    value={(listData.color as ListColor) || 'white'}
                    onChange={(color) => {
                      updateListColor(listId, color)
                      setShowMenu(false)
                    }}
                  />
                </div>
                <div className="border-t border-black/5" />
                <button
                  onClick={() => {
                    if (confirm('Delete this list?')) {
                      deleteList(listId)
                      router.push('/lists')
                    }
                  }}
                  className="flex w-full items-center gap-2 px-2 py-2 rounded-md text-sm text-red-700 pointer-hover:hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete list
                </button>
              </div>
            )}
          </div>
          <button onClick={handleCopy} className="rounded-lg p-2.5 text-black/40 pointer-hover:hover:bg-black/5 pointer-hover:hover:text-black/70">
            {copied ? <Check className="h-4 w-4 text-green-700" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className={`fixed bottom-6 right-4 z-40 rounded-full p-4 text-white shadow-lg sm:static sm:p-2.5 sm:shadow-none ${COLOR_BG[(listData.color as ListColor) || 'white']}`}
        >
          <Plus className="h-6 w-6 sm:h-4 sm:w-4" />
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-32" onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg">
            <AddItemForm listId={listId} existingNames={items.map((i) => i.data.name)} onAdd={() => setShowAdd(false)} autoFocus />
          </div>
        </div>
      )}

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
                    className={`flex items-center gap-3 ring-1 ring-black/5 rounded-2xl bg-white px-4 py-3 shadow-sm ${
                      isDragged
                        ? 'shadow-md scale-102'
                        : `${dragging ? ' transition-transform duration-200' : ''}`
                    }`}
                  >
                    <span
                      className="-my-3 -ml-4 flex items-center self-stretch touch-none cursor-grab py-3 pl-4 pr-1 text-stone-300 select-none active:cursor-grabbing"
                      onPointerDown={(e) => handleGripDown(e, i)}
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <span className="w-6 text-right text-base font-medium text-stone-400">{i + 1}</span>
                    <span className="flex-1 text-base font-medium">{item.data.name}</span>
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
          <h2 className="mb-3 text-sm font-semibold text-center text-black/40">Unranked</h2>
          <ul className="flex flex-col gap-2">
            {unrankedItems.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex w-[calc(20px+24px+12px)] items-center">
                  <Link
                    href={`/lists/${listId}/rank/${item.id}`}
                    className={`rounded-lg px-2 py-[3px] ${COLOR_TEXT[(listData.color as ListColor) || 'white']}`}
                  >
                    <span className="text-base font-medium">Rank</span>
                  </Link>
                </div>
                <span className="flex-1 text-base font-medium">{item.data.name}</span>
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
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      ) : rankedItems.length === 0 && unrankedItems.length === 0 ? (
        <div className="flex flex-1 max-h-64 flex-col items-center justify-center text-black/40">
          <p className="text-sm font-medium">No items yet</p>
          <p className="mt-1 text-xs">Tap the + button to add your first item</p>
        </div>
      ) : null}
    </main>
  )
}
