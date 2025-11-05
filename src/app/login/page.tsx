'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-60 floating-element"></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full opacity-60 floating-element"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full opacity-60 floating-element"></div>

      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600">Sign in to your TomSoft PM account</p>
        </div>

        {/* Login Form */}
        <div className="card-modern p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pr-12"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-4">Demo Accounts:</h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-mono">admin@tomsoft.pl / password123</span>
              </div>
              <div className="flex justify-between">
                <span>PM:</span>
                <span className="font-mono">pm@tomsoft.pl / password123</span>
              </div>
              <div className="flex justify-between">
                <span>Developer:</span>
                <span className="font-mono">dev@tomsoft.pl / password123</span>
              </div>
              <div className="flex justify-between">
                <span>Client:</span>
                <span className="font-mono">client@example.com / password123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>© 2024 TomSoft. Technology with soul.</p>
        </div>
      </div>
    </div>
  )
}
