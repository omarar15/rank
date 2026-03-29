'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmationResult } from 'firebase/auth'
import { createUserDoc } from '@/lib/firestore'
import { createSession } from '@/app/actions/session'
import { useWebHaptics } from 'web-haptics/react'

interface Props {
  phone: string
  confirmation: ConfirmationResult
  onBack: () => void
}

export function OtpForm({ phone, confirmation, onBack }: Props) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)
  const { trigger } = useWebHaptics()
  const router = useRouter()

  function formatOtp(digits: string): string {
    if (digits.length <= 3) return digits
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)}`
  }

  async function submitCode(code: string) {
    if (submittingRef.current) return
    submittingRef.current = true
    setError('')
    setLoading(true)
    try {
      const result = await confirmation.confirm(code)
      await createUserDoc(result.user.uid, phone)
      await createSession()
      router.push('/lists')
    } catch {
      setError('Invalid code. Please try again.')
      setLoading(false)
      submittingRef.current = false
    }
  }

  function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
    if (digits.length === 6) {
      submitCode(digits)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length === 6) submitCode(otp)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-center text-sm text-stone-500">
        Enter the 6-digit code sent to <span className="font-medium text-stone-800">{phone}</span>
      </p>
      <input
        type="text"
        inputMode="numeric"
        maxLength={7}
        placeholder="123 456"
        value={formatOtp(otp)}
        onChange={handleOtpChange}
        className="w-full rounded-xl border border-stone-200 py-3 text-2xl tracking-widest outline-none focus:border-stone-400"
        style={{ fontVariantNumeric: 'tabular-nums', paddingLeft: 'calc((100% - 7ch - 7 * 0.1em) / 2)', paddingRight: 'calc((100% - 7ch - 7 * 0.1em) / 2)' }}
        autoFocus
        required
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        onClick={() => trigger('light')}
        className="rounded-xl bg-stone-900 px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        {loading ? 'Verifying…' : 'Verify code'}
      </button>
      <button type="button" onClick={() => { trigger('light'); onBack() }} className="text-sm text-stone-400 underline">
        Use a different number
      </button>
    </form>
  )
}
