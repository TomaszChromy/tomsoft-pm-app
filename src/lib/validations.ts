import { z } from 'zod'

// User validations
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorToken: z.string().optional(),
})

export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']).optional(),
  isActive: z.boolean().optional(),
})

// Project validations
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  clientId: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

// Task validations
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project ID is required'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().positive().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  parentTaskId: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  position: z.number().optional()
})

// Query schemas
export const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Client validations
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  description: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

// Comment validations
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
})

// Time entry validations
export const createTimeEntrySchema = z.object({
  description: z.string().optional(),
  hours: z.number().positive('Hours must be positive'),
  date: z.string().datetime().optional(),
  projectId: z.string(),
  taskId: z.string().optional(),
})

export const updateTimeEntrySchema = createTimeEntrySchema.partial().omit({ projectId: true })

// Project member validations
export const addProjectMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['LEAD', 'MEMBER', 'VIEWER']).optional(),
})

export const updateProjectMemberSchema = z.object({
  role: z.enum(['LEAD', 'MEMBER', 'VIEWER']),
})

// Notification validations
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Notification title is required'),
  message: z.string().min(1, 'Notification message is required'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'PROJECT_UPDATE', 'COMMENT_ADDED']).optional(),
  userId: z.string(),
})

// Query parameter validations
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const projectFiltersSchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  clientId: z.string().optional(),
  ownerId: z.string().optional(),
})

export const taskFiltersSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
})

// Input sanitization utilities
export class InputSanitizer {
  /**
   * Sanitize HTML content (basic implementation)
   */
  static sanitizeHtml(input: string): string {
    // Basic HTML sanitization - remove dangerous tags and attributes
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .trim()
  }

  /**
   * Sanitize plain text (remove HTML tags)
   */
  static sanitizeText(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim()
  }

  /**
   * Sanitize and validate email
   */
  static sanitizeEmail(input: string): string {
    const sanitized = this.sanitizeText(input).toLowerCase().trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format')
    }
    return sanitized
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(input: string): string {
    return this.sanitizeText(input)
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;]/g, '') // Remove semicolons
      .trim()
      .substring(0, 100) // Limit search query length
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(input: string): string {
    return input
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\.\./g, '') // Remove directory traversal
      .trim()
      .substring(0, 255) // Limit filename length
  }

  /**
   * Sanitize URL
   */
  static sanitizeUrl(input: string): string {
    const sanitized = input.trim()
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i
    if (!urlRegex.test(sanitized)) {
      throw new Error('Invalid URL format')
    }
    return sanitized
  }
}

// Enhanced Zod schemas with sanitization
export const sanitizedStringSchema = z.string().transform((val) => InputSanitizer.sanitizeText(val))
export const sanitizedHtmlSchema = z.string().transform((val) => InputSanitizer.sanitizeHtml(val))
export const sanitizedSearchSchema = z.string().transform((val) => InputSanitizer.sanitizeSearchQuery(val))
