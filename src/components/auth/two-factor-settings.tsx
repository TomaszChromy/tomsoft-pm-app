'use client'

import { useState, useEffect } from 'react'
import { Shield, Key, AlertTriangle, Check, X } from 'lucide-react'
import { TwoFactorSetup } from './two-factor-setup'

interface TwoFactorStatus {
  enabled: boolean
  backupCodesCount: number
}

export function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [showSetup, setShowSetup] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [showRegenerateBackup, setShowRegenerateBackup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Disable form state
  const [disablePassword, setDisablePassword] = useState('')
  const [disableToken, setDisableToken] = useState('')

  // Regenerate backup codes form state
  const [regenPassword, setRegenPassword] = useState('')
  const [regenToken, setRegenToken] = useState('')
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error)
    }
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    fetchStatus()
  }

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          password: disablePassword,
          token: disableToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA')
      }

      setShowDisable(false)
      setDisablePassword('')
      setDisableToken('')
      fetchStatus()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to disable 2FA')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateBackupCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/backup-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          password: regenPassword,
          token: regenToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate backup codes')
      }

      setNewBackupCodes(data.backupCodes)
      setRegenPassword('')
      setRegenToken('')
      fetchStatus()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to regenerate backup codes')
    } finally {
      setIsLoading(false)
    }
  }

  const downloadBackupCodes = () => {
    if (!newBackupCodes.length) return

    const content = `TomSoft PM - 2FA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${newBackupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tomsoft-pm-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={handleSetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    )
  }

  if (!status) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className={`w-6 h-6 mr-3 ${status.enabled ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">
                {status.enabled 
                  ? 'Your account is protected with 2FA' 
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.enabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {status.enabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800">2FA is active on your account</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Key className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-800">
                  {status.backupCodesCount} backup codes remaining
                </span>
              </div>
              {status.backupCodesCount < 3 && (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRegenerateBackup(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Regenerate Backup Codes
              </button>
              <button
                onClick={() => setShowDisable(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Recommended:</p>
                  <p>Enable 2FA to protect your account from unauthorized access, even if your password is compromised.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Enable Two-Factor Authentication
            </button>
          </div>
        )}
      </div>

      {/* Disable 2FA Modal */}
      {showDisable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Disable Two-Factor Authentication</h3>
              <button
                onClick={() => {
                  setShowDisable(false)
                  setError('')
                  setDisablePassword('')
                  setDisableToken('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Warning:</p>
                  <p>Disabling 2FA will make your account less secure. You'll only need your password to sign in.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleDisable2FA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2FA Code
                </label>
                <input
                  type="text"
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center font-mono"
                  maxLength={6}
                  required
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
                  type="button"
                  onClick={() => {
                    setShowDisable(false)
                    setError('')
                    setDisablePassword('')
                    setDisableToken('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Modal */}
      {showRegenerateBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Regenerate Backup Codes</h3>
              <button
                onClick={() => {
                  setShowRegenerateBackup(false)
                  setError('')
                  setRegenPassword('')
                  setRegenToken('')
                  setNewBackupCodes([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {newBackupCodes.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800">New backup codes generated successfully!</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your new backup codes:
                  </label>
                  <div className="bg-gray-100 border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {newBackupCodes.map((code, index) => (
                        <div key={index} className="text-center py-1">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Important:</p>
                      <p>Your old backup codes are no longer valid. Save these new codes in a safe place.</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={downloadBackupCodes}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Download Codes
                  </button>
                  <button
                    onClick={() => {
                      setShowRegenerateBackup(false)
                      setNewBackupCodes([])
                    }}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegenerateBackupCodes} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    This will generate 10 new backup codes and invalidate your existing ones.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={regenPassword}
                    onChange={(e) => setRegenPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2FA Code
                  </label>
                  <input
                    type="text"
                    value={regenToken}
                    onChange={(e) => setRegenToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center font-mono"
                    maxLength={6}
                    required
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
                    type="button"
                    onClick={() => {
                      setShowRegenerateBackup(false)
                      setError('')
                      setRegenPassword('')
                      setRegenToken('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Generating...' : 'Generate New Codes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
