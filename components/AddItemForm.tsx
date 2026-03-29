'use client'

import { useState } from 'react'
import { addItem } from '@/lib/firestore'

interface Props {
  listId: string
}

export function AddItemForm({ listId }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await addItem(listId, name.trim())
      setName('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Add item…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
        required
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Add
      </button>
    </form>
  )
}
