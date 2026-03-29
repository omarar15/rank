'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addItem } from '@/lib/firestore'

interface Props {
  listId: string
}

export function AddItemForm({ listId }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(rank: boolean) {
    if (!name.trim()) return
    setLoading(true)
    try {
      const itemId = await addItem(listId, name.trim())
      setName('')
      if (rank) router.push(`/lists/${listId}/rank/${itemId}`)
    } finally {
      setLoading(false)
    }
  }

  const empty = !name.trim()

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
      <div className="flex gap-2">
        <button
          onClick={() => handleAdd(true)}
          disabled={loading || empty}
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add &amp; rank
        </button>
        <button
          onClick={() => handleAdd(false)}
          disabled={loading || empty}
          className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 disabled:opacity-40"
        >
          Add to list
        </button>
      </div>
    </div>
  )
}
