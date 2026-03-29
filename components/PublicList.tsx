'use client'

import { useEffect, useState } from 'react'
import { collection, query, where, limit, getDocs, onSnapshot, doc } from 'firebase/firestore'
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
    let unsubItems: (() => void) | null = null
    let currentListData: ListDoc | null = null
    let currentNameMap: Record<string, string> = {}
    let itemsReady = false

    function resolve() {
      if (!currentListData || !itemsReady) return
      const resolved = currentListData.rankedItems
        .map((id) => ({ id, name: currentNameMap[id] ?? id }))
        .filter((i) => i.name)
      setTitle(currentListData.title)
      setRankedItems(resolved)
      setLoading(false)
    }

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

      const listId = snap.docs[0].id

      unsubList = onSnapshot(doc(db, 'lists', listId), (listSnap) => {
        if (!listSnap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        currentListData = listSnap.data() as ListDoc
        resolve()
      })

      unsubItems = onSnapshot(collection(db, 'lists', listId, 'items'), (itemsSnap) => {
        const nameMap: Record<string, string> = {}
        itemsSnap.docs.forEach((d) => {
          nameMap[d.id] = (d.data() as ItemDoc).name
        })
        currentNameMap = nameMap
        itemsReady = true
        resolve()
      })
    }

    findList()
    return () => {
      unsubList?.()
      unsubItems?.()
    }
  }, [shareToken])

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-stone-400">Loading…</div>
  }

  if (notFound) {
    return <div className="flex min-h-dvh items-center justify-center text-stone-400">List not found.</div>
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-8">
      <h1 className="mb-8 text-xl font-semibold tracking-tight">{title}</h1>

      {rankedItems.length === 0 ? (
        <p className="text-center text-sm text-stone-400">No ranked items yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rankedItems.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm"
            >
              <span className="w-6 text-right text-sm font-bold text-stone-300">{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{item.name}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
