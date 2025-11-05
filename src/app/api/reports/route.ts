import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const reportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  type: z.enum(['PROJECT_SUMMARY', 'TIME_TRACKING', 'TEAM_PERFORMANCE', 'SPRINT_ANALYSIS', 'CUSTOM']),
  filters: z.object({
    projectIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    sprintIds: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
  }).optional(),
  metrics: z.array(z.string()).optional(),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const projectId = searchParams.get('projectId')

    // Get saved reports
    let whereClause: any = {
      OR: [
        { createdById: user.id },
        { isPublic: true }
      ]
    }

    if (reportType) {
      whereClause.type = reportType
    }

    const savedReports = await prisma.report.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      reports: savedReports,
      total: savedReports.length
    })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    const validatedData = reportSchema.parse(body)

    const report = await prisma.report.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        filters: validatedData.filters ? JSON.stringify(validatedData.filters) : null,
        metrics: validatedData.metrics ? JSON.stringify(validatedData.metrics) : null,
        groupBy: validatedData.groupBy ? JSON.stringify(validatedData.groupBy) : null,
        sortBy: validatedData.sortBy,
        sortOrder: validatedData.sortOrder || 'desc',
        createdById: user.id,
        isPublic: false,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    return NextResponse.json({ report }, { status: 201 })

  } catch (error) {
    console.error('Create report error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
