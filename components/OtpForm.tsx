'use client'

import { useState } from 'react'
import { ConfirmationResult } from 'firebase/auth'
import { createUserDoc } from '@/lib/firestore'

interface Props {
  phone: string
  confirmation: ConfirmationResult
  onBack: () => void
}

export function OtpForm({ phone, confirmation, onBack }: Props) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await confirmation.confirm(otp.trim())
      await createUserDoc(result.user.uid, phone)
      // AuthProvider will detect the state change and downstream redirect takes over
    } catch {
      setError('Invalid code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-stone-500">
        Enter the 6-digit code sent to <span className="font-medium text-stone-800">{phone}</span>
      </p>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="123456"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="w-full rounded-xl border border-stone-200 px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-stone-400"
        autoFocus
        required
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="rounded-xl bg-stone-900 px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        {loading ? 'Verifying…' : 'Verify code'}
      </button>
      <button type="button" onClick={onBack} className="text-sm text-stone-400 underline">
        Use a different number
      </button>
    </form>
  )
}
