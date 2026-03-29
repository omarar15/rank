'use client'

import { LIST_COLORS, ListColor } from '@/lib/types'
import { Check } from 'lucide-react'

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
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="grid w-fit grid-cols-4 gap-2">
      {LIST_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${c === 'white' ? 'border-black/15' : 'border-white/50'} ${COLOR_CLASS[c]}`}
        >
          {value === c && <Check className={`h-3 w-3 ${c === 'white' ? 'text-black/40' : 'text-white'}`} />}
        </button>
      ))}
    </div>
  )
}
