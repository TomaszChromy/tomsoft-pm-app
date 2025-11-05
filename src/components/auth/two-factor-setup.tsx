'use client'

import { useState } from 'react'
import { Shield, Copy, Download, Check, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

interface TwoFactorSetupProps {
  onComplete: () => void
  onCancel: () => void
}

interface SetupData {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [savedBackupCodes, setSavedBackupCodes] = useState(false)

  const generateSetup = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate setup')
      }

      setSetupData(data)
      setStep('verify')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate setup')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    if (!setupData || !verificationCode) {
      setError('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationCode,
          backupCodes: setupData.backupCodes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA')
      }

      setStep('backup')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to enable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const copySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return

    const content = `TomSoft PM - 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tomsoft-pm-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setSavedBackupCodes(true)
  }

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Enable Two-Factor Authentication</h2>
          <p className="text-gray-600 mt-2">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>• Your smartphone or tablet</li>
              <li>• A safe place to store backup codes</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={generateSetup}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Start Setup'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'verify' && setupData) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
          <p className="text-gray-600 mt-2">
            Use your authenticator app to scan this QR code
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <Image
                src={setupData.qrCodeUrl}
                alt="2FA QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter this code manually:
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 border rounded-lg text-sm font-mono">
                {setupData.secret}
              </code>
              <button
                onClick={copySecret}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
                title="Copy secret"
              >
                {copiedSecret ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
              Enter verification code:
            </label>
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg font-mono"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setStep('setup')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={verifyAndEnable}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'backup' && setupData) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Check className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">2FA Enabled Successfully!</h2>
          <p className="text-gray-600 mt-2">
            Save your backup codes in a safe place
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important:</p>
                <p>These backup codes can be used to access your account if you lose your authenticator device. Each code can only be used once.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Codes:
            </label>
            <div className="bg-gray-100 border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {setupData.backupCodes.map((code, index) => (
                  <div key={index} className="text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={downloadBackupCodes}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Backup Codes
          </button>

          <div className="flex items-center">
            <input
              id="saved-codes"
              type="checkbox"
              checked={savedBackupCodes}
              onChange={(e) => setSavedBackupCodes(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="saved-codes" className="text-sm text-gray-700">
              I have saved my backup codes in a safe place
            </label>
          </div>

          <button
            onClick={onComplete}
            disabled={!savedBackupCodes}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Complete Setup
          </button>
        </div>
      </div>
    )
  }

  return null
}
