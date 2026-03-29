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
  pivotIndex: number
  skippedInRange: number[]
  rankedItems: string[]
  itemNames: Record<string, string>
  itemBeingRankedName: string
}

type RankAction =
  | { type: 'INIT'; rankedItems: string[]; itemNames: Record<string, string>; itemBeingRankedName: string }
  | { type: 'CHOOSE_BETTER' }
  | { type: 'CHOOSE_WORSE' }
  | { type: 'SKIP' }
  | { type: 'ERROR' }

function nextSkipPivot(lo: number, hi: number, current: number, skipped: number[]): { pivotIndex: number; skippedInRange: number[] } {
  const skippedInRange = [...skipped, current]
  const available = Array.from({ length: hi - lo }, (_, i) => lo + i).filter(
    (i) => !skippedInRange.includes(i),
  )
  if (available.length > 0) {
    const pivotIndex = available[Math.floor(Math.random() * available.length)]
    return { pivotIndex, skippedInRange }
  }
  // All exhausted — fall back to mid
  return { pivotIndex: Math.floor((lo + hi) / 2), skippedInRange }
}

function reducer(state: RankState, action: RankAction): RankState {
  switch (action.type) {
    case 'INIT': {
      const { rankedItems, itemNames, itemBeingRankedName } = action
      if (rankedItems.length === 0) {
        return { ...state, phase: 'done', rankedItems, itemNames, itemBeingRankedName, lo: 0, hi: 0, pivotIndex: 0, skippedInRange: [] }
      }
      const lo = 0
      const hi = rankedItems.length
      const pivotIndex = Math.floor((lo + hi) / 2)
      return { ...state, phase: 'comparing', lo, hi, pivotIndex, skippedInRange: [], rankedItems, itemNames, itemBeingRankedName }
    }
    case 'CHOOSE_BETTER': {
      const hi = state.pivotIndex
      if (state.lo === hi) return { ...state, phase: 'done', hi }
      const pivotIndex = Math.floor((state.lo + hi) / 2)
      return { ...state, hi, pivotIndex, skippedInRange: [] }
    }
    case 'CHOOSE_WORSE': {
      const lo = state.pivotIndex + 1
      if (lo === state.hi) return { ...state, phase: 'done', lo }
      const pivotIndex = Math.floor((lo + state.hi) / 2)
      return { ...state, lo, pivotIndex, skippedInRange: [] }
    }
    case 'SKIP': {
      const { pivotIndex, skippedInRange } = nextSkipPivot(state.lo, state.hi, state.pivotIndex, state.skippedInRange)
      return { ...state, pivotIndex, skippedInRange }
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
  pivotIndex: 0,
  skippedInRange: [],
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

        const rankedItems = listData.rankedItems.filter((id) => id !== itemId)

        dispatch({ type: 'INIT', rankedItems, itemNames, itemBeingRankedName: itemData.name })
      } catch {
        dispatch({ type: 'ERROR' })
      }
    }

    init()
  }, [listId, itemId, user])

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
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">Something went wrong.</div>
  }

  if (state.phase === 'done') {
    return <div className="flex min-h-dvh items-center justify-center text-zinc-400">Saving…</div>
  }

  const { lo, hi, pivotIndex, rankedItems, itemNames, itemBeingRankedName } = state
  const pivotName = itemNames[rankedItems[pivotIndex]] ?? rankedItems[pivotIndex]
  const totalComparisons = Math.ceil(Math.log2(rankedItems.length + 1))
  const done = totalComparisons - Math.ceil(Math.log2(hi - lo + 1))

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-xs text-zinc-400">
          Which do you prefer? ({done + 1} of ~{totalComparisons})
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: 'CHOOSE_BETTER' })}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white px-4 py-8 text-center font-semibold text-zinc-900 active:bg-zinc-50"
          >
            {itemBeingRankedName}
          </button>

          <div className="flex items-center text-sm font-medium text-zinc-400">vs</div>

          <button
            onClick={() => dispatch({ type: 'CHOOSE_WORSE' })}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white px-4 py-8 text-center font-semibold text-zinc-900 active:bg-zinc-50"
          >
            {pivotName}
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'SKIP' })}
          className="mt-4 w-full py-2 text-sm text-zinc-400 underline"
        >
          Can't decide
        </button>
      </div>
    </main>
  )
}
