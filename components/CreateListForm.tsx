'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createList } from '@/lib/firestore'

interface Props {
  ownerId: string
}

export function CreateListForm({ ownerId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      const listId = await createList(ownerId, title.trim())
      router.push(`/lists/${listId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="New list name…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-zinc-400"
        required
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Create
      </button>
    </form>
  )
}
