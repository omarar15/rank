'use server'

import { cookies } from 'next/headers'

const COOKIE_NAME = 'auth-session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function createSession() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
    sameSite: 'lax',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
