import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthProvider } from '@/components/AuthProvider'

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  if (!cookieStore.get('auth-session')) {
    redirect('/')
  }
  return <AuthProvider>{children}</AuthProvider>
}
