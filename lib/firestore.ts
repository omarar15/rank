import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'
export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export async function createUserDoc(uid: string, phone: string) {
  await setDoc(doc(db, 'users', uid), { phone, createdAt: serverTimestamp() }, { merge: true })
}

export async function createList(ownerId: string, title: string): Promise<string> {
  const ref = await addDoc(collection(db, 'lists'), {
    ownerId,
    title,
    shareToken: generateToken(),
    rankedItems: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function addItem(listId: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'lists', listId, 'items'), {
    name,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteItem(listId: string, itemId: string) {
  await deleteDoc(doc(db, 'lists', listId, 'items', itemId))
  await updateDoc(doc(db, 'lists', listId), {
    rankedItems: arrayRemove(itemId),
    updatedAt: serverTimestamp(),
  })
}

export async function setRankedItems(listId: string, rankedItems: string[]) {
  await updateDoc(doc(db, 'lists', listId), {
    rankedItems,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteList(listId: string) {
  await deleteDoc(doc(db, 'lists', listId))
}
