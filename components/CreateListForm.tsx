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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const listId = createList(ownerId, title.trim())
    router.push(`/lists/${listId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="New list name…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-stone-400"
        autoFocus
        required
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        Create
      </button>
    </form>
  )
}
