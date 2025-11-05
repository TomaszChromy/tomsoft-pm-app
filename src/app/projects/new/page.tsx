'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Nazwa projektu jest wymagana').max(100, 'Nazwa nie może być dłuższa niż 100 znaków'),
  description: z.string().optional(),
  clientId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0, 'Budżet nie może być ujemny').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING')
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

export default function NewProjectPage() {
  const { user, token, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'PLANNING'
    }
  })

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'PROJECT_MANAGER') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Brak uprawnień</h2>
          <p className="text-slate-600 mb-4">Nie masz uprawnień do tworzenia projektów</p>
          <Link href="/projects" className="btn-primary">
            Powrót do projektów
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: CreateProjectForm) => {
    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...data,
          budget: data.budget ? Number(data.budget) : undefined,
          startDate: data.startDate || undefined,
          endDate: data.endDate || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Błąd podczas tworzenia projektu')
      }

      const project = await response.json()
      setSubmitSuccess(true)
      
      // Redirect to project details after 2 seconds
      setTimeout(() => {
        router.push(`/projects/${project.id}`)
      }, 2000)

    } catch (error: any) {
      setSubmitError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/projects"
                className="p-2 text-slate-600 hover:text-indigo-600 transition-colors rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Nowy projekt</h1>
                <p className="text-slate-600">Utwórz nowy projekt dla zespołu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-8">
            {submitSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-emerald-800 font-medium">Projekt został utworzony!</p>
                  <p className="text-emerald-700 text-sm">Przekierowywanie do szczegółów projektu...</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <div>
                  <p className="text-rose-800 font-medium">Błąd podczas tworzenia projektu</p>
                  <p className="text-rose-700 text-sm">{submitError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Podstawowe informacje
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="form-label">
                      Nazwa projektu *
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`form-input ${errors.name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      placeholder="np. Aplikacja mobilna TomSoft"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-rose-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="form-label">
                      Opis projektu
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className={`form-input ${errors.description ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      placeholder="Opisz cel i zakres projektu..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-rose-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">
                      Priorytet
                    </label>
                    <select
                      {...register('priority')}
                      className="form-input"
                    >
                      <option value="LOW">Niski</option>
                      <option value="MEDIUM">Średni</option>
                      <option value="HIGH">Wysoki</option>
                      <option value="URGENT">Pilny</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Status początkowy
                    </label>
                    <select
                      {...register('status')}
                      className="form-input"
                    >
                      <option value="PLANNING">Planowanie</option>
                      <option value="ACTIVE">Aktywny</option>
                      <option value="ON_HOLD">Wstrzymany</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Harmonogram
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      Data rozpoczęcia
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Data zakończenia
                    </label>
                    <input
                      type="date"
                      {...register('endDate')}
                      min={startDate || undefined}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Budżet
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      Budżet projektu (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('budget', { valueAsNumber: true })}
                      className={`form-input ${errors.budget ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.budget && (
                      <p className="mt-1 text-sm text-rose-600">{errors.budget.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                <Link
                  href="/projects"
                  className="btn-secondary"
                >
                  Anuluj
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || submitSuccess}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Tworzenie...
                    </>
                  ) : (
                    'Utwórz projekt'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
