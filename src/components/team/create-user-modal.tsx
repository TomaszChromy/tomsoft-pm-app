'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateUser } from '@/hooks/use-users'
import { X, User, Mail, Lock, UserCheck, Briefcase, DollarSign, FileText, Tag } from 'lucide-react'

const createUserSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  username: z.string().min(3, 'Username musi mieć co najmniej 3 znaki'),
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  avatar: z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  bio: z.string().optional(),
  skills: z.string().optional(),
  hourlyRate: z.number().positive('Stawka musi być dodatnia').optional()
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createUserMutation = useCreateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'DEVELOPER',
      avatar: '',
      bio: '',
      skills: ''
    }
  })

  const skillsValue = watch('skills')

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    try {
      const submitData = {
        ...data,
        avatar: data.avatar || undefined,
        bio: data.bio || undefined,
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        hourlyRate: data.hourlyRate || undefined
      }

      await createUserMutation.mutateAsync(submitData)
      reset()
      onClose()
    } catch (error) {
      console.error('Error creating user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Dodaj nowego użytkownika</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Imię *
              </label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Jan"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nazwisko *
              </label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Kowalski"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="jan.kowalski@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserCheck className="w-4 h-4 inline mr-2" />
                Username *
              </label>
              <input
                type="text"
                {...register('username')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="jkowalski"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Rola *
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="DEVELOPER">Developer</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="CLIENT">Client</option>
                <option value="VIEWER">Viewer</option>
                <option value="ADMIN">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Hasło *
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Optional Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informacje dodatkowe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Avatar URL
                </label>
                <input
                  type="url"
                  {...register('avatar')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
                {errors.avatar && (
                  <p className="mt-1 text-sm text-red-600">{errors.avatar.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Stawka godzinowa ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('hourlyRate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="50.00"
                />
                {errors.hourlyRate && (
                  <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Krótki opis użytkownika..."
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Umiejętności
              </label>
              <input
                type="text"
                {...register('skills')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="React, TypeScript, Node.js (oddziel przecinkami)"
              />
              {skillsValue && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {skillsValue.split(',').map((skill, index) => {
                    const trimmedSkill = skill.trim()
                    if (!trimmedSkill) return null
                    return (
                      <span
                        key={index}
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                      >
                        {trimmedSkill}
                      </span>
                    )
                  })}
                </div>
              )}
              {errors.skills && (
                <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {createUserMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">
                {createUserMutation.error instanceof Error 
                  ? createUserMutation.error.message 
                  : 'Wystąpił błąd podczas tworzenia użytkownika'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Tworzenie...' : 'Utwórz użytkownika'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
