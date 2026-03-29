import {
  collection,
  doc,
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

export function createList(ownerId: string, title: string, color: string = 'white'): string {
  const ref = doc(collection(db, 'lists'))
  setDoc(ref, {
    ownerId,
    title,
    color,
    shareToken: generateToken(),
    rankedItems: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateListColor(listId: string, color: string) {
  await updateDoc(doc(db, 'lists', listId), {
    color,
    updatedAt: serverTimestamp(),
  })
}

export function addItem(listId: string, name: string): string {
  const ref = doc(collection(db, 'lists', listId, 'items'))
  setDoc(ref, { name, createdAt: serverTimestamp() })
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
