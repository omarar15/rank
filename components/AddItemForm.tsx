'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addItem, setRankedItems } from '@/lib/firestore'
import { ListColor } from '@/lib/types'

const COLOR_PRIMARY_BTN: Record<ListColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
  white: 'bg-stone-900',
}

interface Props {
  listId: string
  existingNames: string[]
  currentRankedIds: string[]
  color?: ListColor
  onAdd?: () => void
  autoFocus?: boolean
}

export function AddItemForm({ listId, existingNames, currentRankedIds, color = 'white', onAdd, autoFocus }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const trimmed = name.trim()
  const isDuplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())

  function handleAdd(rank: boolean) {
    if (!trimmed || isDuplicate) return
    const itemId = addItem(listId, trimmed, description.trim() || undefined)
    setName('')
    setDescription('')
    onAdd?.()
    if (rank) {
      if (currentRankedIds.length === 0) {
        setRankedItems(listId, [itemId])
      } else {
        router.push(`/lists/${listId}/rank/${itemId}`)
      }
    }
  }

  const empty = !trimmed

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Add item…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd(true)}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base outline-none focus:border-stone-400"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-base text-stone-600 outline-none focus:border-stone-400"
      />
      {isDuplicate && (
        <p className="text-xs text-red-400">Already in this list.</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => handleAdd(false)}
          disabled={empty || isDuplicate}
          className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-700 disabled:text-stone-300"
        >
          Add unranked
        </button>
        <button
          onClick={() => handleAdd(true)}
          disabled={empty || isDuplicate}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:text-white/40 ${COLOR_PRIMARY_BTN[color]}`}
        >
          Add &amp; rank
        </button>
      </div>
    </div>
  )
}
