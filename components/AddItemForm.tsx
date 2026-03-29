'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addItem } from '@/lib/firestore'

interface Props {
  listId: string
  existingNames: string[]
}

export function AddItemForm({ listId, existingNames }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')

  const trimmed = name.trim()
  const isDuplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())

  function handleAdd(rank: boolean) {
    if (!trimmed || isDuplicate) return
    const itemId = addItem(listId, trimmed)
    setName('')
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
        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
      />
      {isDuplicate && (
        <p className="text-xs text-red-400">Already in this list.</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => handleAdd(false)}
          disabled={empty || isDuplicate}
          className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 disabled:opacity-40"
        >
          Add unranked
        </button>
        <button
          onClick={() => handleAdd(true)}
          disabled={empty || isDuplicate}
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add &amp; rank
        </button>
      </div>
    </div>
  )
}
