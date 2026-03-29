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

  const [phone, setPhone] = useState('')
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
      <OtpForm
        phone={phone.startsWith('+') ? phone : `+1${phone}`}
        confirmation={confirmation}
        onBack={() => setConfirmation(null)}
      />
    )
  }

  return (
    <>
      <form onSubmit={handleSend} className="flex flex-col gap-4">
        <label className="text-sm font-medium text-stone-700">Phone number</label>
        <div className="flex items-center rounded-xl border border-stone-200 px-4 py-3 focus-within:border-stone-400">
          <span className="mr-1 text-stone-400">+1</span>
          <input
            type="tel"
            placeholder="555 555 5555"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
