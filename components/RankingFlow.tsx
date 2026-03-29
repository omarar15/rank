'use client'

import { useEffect, useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import { AnimatePresence, motion } from 'motion/react'
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
  const all = Array.from({ length: hi - lo }, (_, i) => lo + i)
  let available = all.filter((i) => !skippedInRange.includes(i))
  if (available.length === 0) {
    // All exhausted — reset and exclude only the current pivot
    available = all.filter((i) => i !== current)
    if (available.length === 0) return { pivotIndex: current, skippedInRange: [] }
    const pivotIndex = available[Math.floor(Math.random() * available.length)]
    return { pivotIndex, skippedInRange: [] }
  }
  const pivotIndex = available[Math.floor(Math.random() * available.length)]
  return { pivotIndex, skippedInRange }
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
  const [exitDir, setExitDir] = useState<1 | -1>(1)
  const [hasVoted, setHasVoted] = useState(false)
  const [lastAction, setLastAction] = useState<'vote' | 'skip' | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/')
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
    const { rankedItems, lo } = state
    const newRankedItems = [...rankedItems.slice(0, lo), itemId, ...rankedItems.slice(lo)]
    setRankedItems(listId, newRankedItems)
    router.push(`/lists/${listId}`)
  }, [state.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || state.phase === 'loading') {
    return <div className="flex min-h-dvh items-center justify-center text-stone-400">Loading…</div>
  }

  if (state.phase === 'error') {
    return <div className="flex min-h-dvh items-center justify-center text-stone-400">Something went wrong.</div>
  }

  const { lo, hi, pivotIndex, rankedItems, itemNames, itemBeingRankedName } = state
  const pivotName = itemNames[rankedItems[pivotIndex]] ?? rankedItems[pivotIndex]
  const totalComparisons = Math.ceil(Math.log2(rankedItems.length + 1))
  const done = totalComparisons - Math.ceil(Math.log2(hi - lo + 1))

  function handleChoice(action: 'CHOOSE_BETTER' | 'CHOOSE_WORSE') {
    // Chosen item goes up, unchosen goes down
    // CHOOSE_BETTER = new item wins → pivot loses → pivot exits down (1)
    // CHOOSE_WORSE = pivot wins → pivot exits up (-1)
    setExitDir(action === 'CHOOSE_BETTER' ? 1 : -1)
    setLastAction('vote')
    if (!hasVoted) setHasVoted(true)
    dispatch({ type: action })
  }

  const progress = totalComparisons > 0 ? (done + 1) / totalComparisons : 0
  const radius = 8
  const stroke = 3
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - Math.min(progress, 1))

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <svg width={2 * (radius + stroke)} height={2 * (radius + stroke)} className="-rotate-90">
            <circle
              cx={radius + stroke}
              cy={radius + stroke}
              r={radius}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth={stroke}
            />
            <circle
              cx={radius + stroke}
              cy={radius + stroke}
              r={radius}
              fill="none"
              stroke="#78716c80"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        </div>

        <p className="mb-6 text-center text-base text-stone-400">Which do you prefer?</p>

        <div className="flex gap-3">
          <button
            onClick={() => handleChoice('CHOOSE_BETTER')}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-4 py-8 text-center font-semibold text-stone-900 active:bg-stone-50"
          >
            {itemBeingRankedName}
          </button>

          <div className="flex items-center text-sm font-medium text-stone-400">vs</div>

          <AnimatePresence mode="popLayout" custom={{ dir: exitDir, action: lastAction }}>
            <motion.button
              key={pivotIndex}
              custom={{ dir: exitDir, action: lastAction }}
              variants={{
                enter: ({ dir }: { dir: number }) => ({ opacity: 0, y: dir * -60, scale: 1 }),
                pop: { opacity: 1, y: 0, scale: [1.1, 1] },
                center: { opacity: 1, y: 0, scale: 1 },
                exit: ({ dir, action }: { dir: number; action: string | null }) =>
                  action === 'skip'
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: dir * 60, scale: 1 },
              }}
              initial={hasVoted ? (lastAction === 'skip' ? 'center' : 'enter') : false}
              animate={lastAction === 'skip' ? 'pop' : 'center'}
              exit="exit"
              transition={{ type: 'spring', duration: 0.25, bounce: 0 }}
              onClick={() => handleChoice('CHOOSE_WORSE')}
              className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-stone-200 bg-white px-4 py-8 text-center font-semibold text-stone-900 active:bg-stone-50"
            >
              {pivotName}
            </motion.button>
          </AnimatePresence>
        </div>

        <button
          onClick={() => { setLastAction('skip'); dispatch({ type: 'SKIP' }) }}
          className="mt-4 w-full py-2 text-base text-stone-400 underline"
        >
          Can't decide
        </button>
      </div>
    </main>
  )
}
