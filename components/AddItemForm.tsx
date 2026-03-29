'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addItem } from '@/lib/firestore'
import { ListColor } from '@/lib/types'

const COLOR_PRIMARY_BTN: Record<ListColor, string> = {
  red: 'bg-red-500 disabled:text-white/40',
  orange: 'bg-orange-500 disabled:text-white/40',
  yellow: 'bg-yellow-500 disabled:text-white/40',
  green: 'bg-green-500 disabled:text-white/40',
  sky: 'bg-sky-500 disabled:text-white/40',
  violet: 'bg-violet-500 disabled:text-white/40',
  pink: 'bg-pink-500 disabled:text-white/40',
  white: 'bg-stone-900 disabled:text-white/40',
}

const COLOR_SECONDARY_BTN: Record<ListColor, string> = {
  red: 'border-red-200 text-red-600 disabled:text-red-300',
  orange: 'border-orange-200 text-orange-600 disabled:text-orange-300',
  yellow: 'border-yellow-200 text-yellow-600 disabled:text-yellow-300',
  green: 'border-green-200 text-green-600 disabled:text-green-300',
  sky: 'border-sky-200 text-sky-600 disabled:text-sky-300',
  violet: 'border-violet-200 text-violet-600 disabled:text-violet-300',
  pink: 'border-pink-200 text-pink-600 disabled:text-pink-300',
  white: 'border-stone-200 text-stone-700 disabled:text-stone-300',
}

const COLOR_INPUT_FOCUS: Record<ListColor, string> = {
  red: 'focus:border-red-400',
  orange: 'focus:border-orange-400',
  yellow: 'focus:border-yellow-400',
  green: 'focus:border-green-400',
  sky: 'focus:border-sky-400',
  violet: 'focus:border-violet-400',
  pink: 'focus:border-pink-400',
  white: 'focus:border-stone-400',
}

interface Props {
  listId: string
  existingNames: string[]
  color?: ListColor
  onAdd?: () => void
  autoFocus?: boolean
}

export function AddItemForm({ listId, existingNames, color = 'white', onAdd, autoFocus }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')

  const trimmed = name.trim()
  const isDuplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())

  function handleAdd(rank: boolean) {
    if (!trimmed || isDuplicate) return
    const itemId = addItem(listId, trimmed)
    setName('')
    onAdd?.()
    if (rank) router.push(`/lists/${listId}/rank/${itemId}`)
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
        className={`w-full rounded-xl border border-stone-200 px-4 py-2.5 text-base outline-none ${COLOR_INPUT_FOCUS[color]}`}
      />
      {isDuplicate && (
        <p className="text-xs text-red-400">Already in this list.</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => handleAdd(false)}
          disabled={empty || isDuplicate}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium ${COLOR_SECONDARY_BTN[color]}`}
        >
          Add unranked
        </button>
        <button
          onClick={() => handleAdd(true)}
          disabled={empty || isDuplicate}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white ${COLOR_PRIMARY_BTN[color]}`}
        >
          Add &amp; rank
        </button>
      </div>
    </div>
  )
}
