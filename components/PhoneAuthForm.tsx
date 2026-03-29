'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from './AuthProvider'
import { OtpForm } from './OtpForm'

export function PhoneAuthForm() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [phone, setPhone] = useState('')  // raw digits only

  function formatPhone(digits: string): string {
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(digits)
  }
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)

  useEffect(() => {
    if (!loading && user) {
      router.push('/lists')
    }
  }, [user, loading, router])

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    return () => {
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
    }
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSending(true)
    const fullPhone = phone.startsWith('+') ? phone : `+1${phone}`
    try {
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current!)
      setConfirmation(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send code.'
      setError(message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return null

  if (confirmation) {
    return (
      <>
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight">rank</h1>
        </div>
        <OtpForm
          phone={phone.startsWith('+') ? phone : `+1${phone}`}
          confirmation={confirmation}
          onBack={() => setConfirmation(null)}
        />
      </>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">rank</h1>
        <p className="mt-2 text-stone-400">rank anything</p>
      </div>
      <form onSubmit={handleSend} className="flex flex-col gap-4">
        <div className="flex items-center rounded-xl border border-stone-200 px-4 py-3 focus-within:border-stone-400">
          <span className="mr-1 text-stone-400">+1</span>
          <input
            type="tel"
            placeholder="(555) 555-5555"
            value={formatPhone(phone)}
            onChange={handlePhoneChange}
            className="flex-1 outline-none placeholder:text-stone-300"
            autoFocus
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-stone-900 px-4 py-3 font-medium text-white disabled:opacity-40"
        >
          {sending ? 'Sending…' : 'Send code'}
        </button>
      </form>
      <div id="recaptcha-container" />
    </>
  )
}
