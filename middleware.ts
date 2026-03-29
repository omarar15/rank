import { NextRequest, NextResponse } from 'next/server'

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('auth-session')
  if (session) return NextResponse.next()

  const { pathname } = request.nextUrl

  // Unauthenticated user visiting a specific list — redirect to its public share URL
  const listMatch = pathname.match(/^\/lists\/([^/]+)$/)
  if (listMatch) {
    const listId = listMatch[1]
    try {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/lists/${listId}?key=${API_KEY}&fields=shareToken`,
      )
      if (res.ok) {
        const data = await res.json()
        const shareToken = data.fields?.shareToken?.stringValue
        if (shareToken) {
          return NextResponse.redirect(new URL(`/share/${shareToken}`, request.url))
        }
      }
    } catch {
      // fall through to login redirect
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}

export const config = {
  matcher: ['/lists/:path*'],
}
