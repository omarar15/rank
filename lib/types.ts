import { Timestamp } from 'firebase/firestore'

export interface UserDoc {
  phone: string
  createdAt: Timestamp
}

export interface ListDoc {
  ownerId: string
  title: string
  shareToken: string
  rankedItems: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ItemDoc {
  name: string
  createdAt: Timestamp
}
