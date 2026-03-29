'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, limit, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ListDoc, ItemDoc } from '@/lib/types'

interface ItemEntry {
  id: string
  name: string
}

interface Props {
  shareToken: string
}

export function PublicList({ shareToken }: Props) {
  const [title, setTitle] = useState('')
  const [rankedItems, setRankedItems] = useState<ItemEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let unsubList: (() => void) | null = null

    async function findList() {
      const q = query(
        collection(db, 'lists'),
        where('shareToken', '==', shareToken),
        limit(1),
      )
      const snap = await getDocs(q)
      if (snap.empty) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const listDoc = snap.docs[0]
      const listId = listDoc.id

      // Subscribe to real-time updates on the list doc
      unsubList = onSnapshot(listDoc.ref, async (listSnap) => {
        if (!listSnap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const data = listSnap.data() as ListDoc
        setTitle(data.title)

        // Resolve item names
        const itemsSnap = await getDocs(collection(db, 'lists', listId, 'items'))
        const nameMap: Record<string, string> = {}
        itemsSnap.docs.forEach((d) => {
          nameMap[d.id] = (d.data() as ItemDoc).name
        })

        const resolved = data.rankedItems
          .map((id) => ({ id, name: nameMap[id] ?? id }))
          .filter((i) => i.name)

        setRankedItems(resolved)
        setLoading(false)
      })
    }

    findList()
    return () => { unsubList?.() }
  }, [shareToken])

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">Loading…</div>
  }

  if (notFound) {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">List not found.</div>
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <h1 className="mb-8 text-xl font-semibold tracking-tight">{title}</h1>

      {rankedItems.length === 0 ? (
        <p className="text-center text-sm text-zinc-400">No ranked items yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rankedItems.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm"
            >
              <span className="w-6 text-right text-sm font-bold text-zinc-300">{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{item.name}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
