'use client'

import { useEffect, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { setRankedItems } from '@/lib/firestore'
import { ListDoc, ItemDoc } from '@/lib/types'

interface RankState {
  phase: 'loading' | 'comparing' | 'done' | 'error'
  lo: number
  hi: number
  rankedItems: string[]
  itemNames: Record<string, string>
  itemBeingRankedName: string
}

type RankAction =
  | { type: 'INIT'; rankedItems: string[]; itemNames: Record<string, string>; itemBeingRankedName: string }
  | { type: 'CHOOSE_BETTER' }
  | { type: 'CHOOSE_WORSE' }
  | { type: 'ERROR' }

function reducer(state: RankState, action: RankAction): RankState {
  switch (action.type) {
    case 'INIT': {
      const { rankedItems, itemNames, itemBeingRankedName } = action
      if (rankedItems.length === 0) {
        return { ...state, phase: 'done', rankedItems, itemNames, itemBeingRankedName, lo: 0, hi: 0 }
      }
      return {
        ...state,
        phase: 'comparing',
        lo: 0,
        hi: rankedItems.length,
        rankedItems,
        itemNames,
        itemBeingRankedName,
      }
    }
    case 'CHOOSE_BETTER': {
      const mid = Math.floor((state.lo + state.hi) / 2)
      const hi = mid
      if (state.lo === hi) return { ...state, phase: 'done', hi }
      return { ...state, hi }
    }
    case 'CHOOSE_WORSE': {
      const mid = Math.floor((state.lo + state.hi) / 2)
      const lo = mid + 1
      if (lo === state.hi) return { ...state, phase: 'done', lo }
      return { ...state, lo }
    }
    case 'ERROR':
      return { ...state, phase: 'error' }
    default:
      return state
  }
}

const initialState: RankState = {
  phase: 'loading',
  lo: 0,
  hi: 0,
  rankedItems: [],
  itemNames: {},
  itemBeingRankedName: '',
}

interface Props {
  listId: string
  itemId: string
}

export function RankingFlow({ listId, itemId }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return

    async function init() {
      try {
        const [listSnap, itemsSnap, itemSnap] = await Promise.all([
          getDoc(doc(db, 'lists', listId)),
          getDocs(collection(db, 'lists', listId, 'items')),
          getDoc(doc(db, 'lists', listId, 'items', itemId)),
        ])

        if (!listSnap.exists() || !itemSnap.exists()) {
          dispatch({ type: 'ERROR' })
          return
        }

        const listData = listSnap.data() as ListDoc
        const itemData = itemSnap.data() as ItemDoc

        const itemNames: Record<string, string> = {}
        itemsSnap.docs.forEach((d) => {
          itemNames[d.id] = (d.data() as ItemDoc).name
        })

        // Exclude the item being ranked from the snapshot (handles re-ranking)
        const rankedItems = listData.rankedItems.filter((id) => id !== itemId)

        dispatch({
          type: 'INIT',
          rankedItems,
          itemNames,
          itemBeingRankedName: itemData.name,
        })
      } catch {
        dispatch({ type: 'ERROR' })
      }
    }

    init()
  }, [listId, itemId, user])

  // When phase transitions to 'done', write to Firestore and navigate back
  useEffect(() => {
    if (state.phase !== 'done') return

    async function commit() {
      const { rankedItems, lo } = state
      const newRankedItems = [...rankedItems.slice(0, lo), itemId, ...rankedItems.slice(lo)]
      await setRankedItems(listId, newRankedItems)
      router.push(`/lists/${listId}`)
    }

    commit()
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || state.phase === 'loading') {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">Loading…</div>
  }

  if (state.phase === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-zinc-400">
        Something went wrong.
      </div>
    )
  }

  if (state.phase === 'done') {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">Saving…</div>
  }

  const { lo, hi, rankedItems, itemNames, itemBeingRankedName } = state
  const mid = Math.floor((lo + hi) / 2)
  const pivotName = itemNames[rankedItems[mid]] ?? rankedItems[mid]
  const totalComparisons = Math.ceil(Math.log2(rankedItems.length + 1))
  const done = totalComparisons - Math.ceil(Math.log2(hi - lo + 1))

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-center text-xs text-zinc-400">
          Comparison {done + 1} of ~{totalComparisons}
        </p>

        <div className="mb-8 rounded-2xl border border-zinc-100 bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ranking</p>
          <p className="mt-1 text-lg font-semibold">{itemBeingRankedName}</p>
        </div>

        <p className="mb-4 text-center text-sm text-zinc-500">compared to</p>

        <div className="mb-8 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-center">
          <p className="text-lg font-semibold">{pivotName}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => dispatch({ type: 'CHOOSE_BETTER' })}
            className="w-full rounded-2xl bg-zinc-900 px-4 py-4 text-base font-semibold text-white active:bg-zinc-700"
          >
            Better ↑
          </button>
          <button
            onClick={() => dispatch({ type: 'CHOOSE_WORSE' })}
            className="w-full rounded-2xl border border-zinc-200 px-4 py-4 text-base font-semibold text-zinc-700 active:bg-zinc-50"
          >
            Worse ↓
          </button>
        </div>
      </div>
    </main>
  )
}
