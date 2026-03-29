'use client'

import { LIST_COLORS, ListColor } from '@/lib/types'
import { Check } from 'lucide-react'
import { useWebHaptics } from 'web-haptics/react'

const COLOR_CLASS: Record<ListColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
  white: 'bg-white',
}

interface Props {
  value: ListColor
  onChange: (color: ListColor) => void
  columns?: 4 | 8
}

export function ColorPicker({ value, onChange, columns = 4 }: Props) {
  const { trigger } = useWebHaptics()
  return (
    <div className={`grid w-fit gap-3 sm:gap-2 ${columns === 8 ? 'grid-cols-8' : 'grid-cols-4'}`}>
      {LIST_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => { trigger('light'); onChange(c) }}
          className={`flex h-8 w-8 sm:h-5 sm:w-5 items-center justify-center rounded-full border-2 ${c === 'white' ? 'border-black/15' : 'border-white/50'} ${COLOR_CLASS[c]}`}
        >
          {value === c && <Check className={`h-4 w-4 sm:h-3 sm:w-3 ${c === 'white' ? 'text-black/40' : 'text-white'}`} />}
        </button>
      ))}
    </div>
  )
}
