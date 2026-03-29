import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PhoneAuthForm } from '@/components/PhoneAuthForm'

export default async function Home() {
  const cookieStore = await cookies()
  if (cookieStore.get('auth-session')) {
    redirect('/lists')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <PhoneAuthForm />
      </div>
    </main>
  )
}
