import { Timestamp } from 'firebase/firestore'

export interface UserDoc {
  phone: string
  createdAt: Timestamp
}

export const LIST_COLORS = ['red', 'orange', 'yellow', 'green', 'sky', 'violet', 'pink', 'white'] as const
export type ListColor = (typeof LIST_COLORS)[number]

export interface ListDoc {
  ownerId: string
  title: string
  color?: ListColor
  shareToken: string
  rankedItems: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ItemDoc {
  name: string
  createdAt: Timestamp
}
