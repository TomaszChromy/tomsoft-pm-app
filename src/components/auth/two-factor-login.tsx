'use client'

import { useState } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'

interface TwoFactorLoginProps {
  email: string
  password: string
  onSuccess: (token: string, user: any) => void
  onBack: () => void
}

export function TwoFactorLogin({ email, password, onSuccess, onBack }: TwoFactorLoginProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setError('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          twoFactorToken: code.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.token && data.user) {
        onSuccess(data.token, data.user)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="text-gray-600 mt-2">
          Enter the verification code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
            {useBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            id="verification-code"
            type="text"
            value={code}
            onChange={(e) => {
              const value = e.target.value.replace(/\s/g, '')
              if (useBackupCode) {
                setCode(value.toUpperCase().slice(0, 8))
              } else {
                setCode(value.replace(/\D/g, '').slice(0, 6))
              }
            }}
            placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg font-mono"
            maxLength={useBackupCode ? 8 : 6}
            autoComplete="off"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {useBackupCode 
              ? 'Enter one of your 8-character backup codes'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode)
              setCode('')
              setError('')
            }}
            className="w-full px-4 py-2 text-indigo-600 hover:text-indigo-700 text-sm"
          >
            {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Login
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Lost your device?</strong> Use one of your backup codes to sign in, 
            then disable and re-enable 2FA with a new device.
          </p>
        </div>
      </div>
    </div>
  )
}
