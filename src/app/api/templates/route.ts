import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/templates - Get project templates
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const isPublic = searchParams.get('public') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Build where clause
    let whereClause: any = {}
    
    if (isPublic) {
      whereClause.isPublic = true
    } else {
      whereClause.OR = [
        { isPublic: true },
        { createdById: user.id }
      ]
    }
    
    if (category) {
      whereClause.category = category
    }
    
    if (search) {
      whereClause.AND = [
        whereClause,
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } }
          ]
        }
      ]
    }
    
    // Get templates with pagination
    const [templates, totalCount, categories] = await Promise.all([
      prisma.projectTemplate.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              phases: true,
              tasks: true,
              milestones: true
            }
          }
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      
      prisma.projectTemplate.count({ where: whereClause }),
      
      // Get available categories
      prisma.projectTemplate.groupBy({
        by: ['category'],
        where: {
          OR: [
            { isPublic: true },
            { createdById: user.id }
          ]
        },
        _count: {
          category: true
        }
      })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        templates: templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
          isPublic: template.isPublic,
          defaultDuration: template.defaultDuration,
          estimatedHours: template.estimatedHours,
          complexity: template.complexity,
          usageCount: template.usageCount,
          rating: template.rating,
          createdBy: template.createdBy,
          counts: template._count,
          createdAt: template.createdAt
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        categories: categories.map(cat => ({
          name: cat.category,
          count: cat._count.category
        }))
      }
    })

  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create new project template
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const {
      name,
      description,
      category,
      tags = [],
      isPublic = false,
      defaultDuration,
      estimatedHours,
      complexity,
      phases = [],
      tasks = [],
      milestones = []
    } = body
    
    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }
    
    // Create template with related data
    const template = await prisma.projectTemplate.create({
      data: {
        name,
        description,
        category,
        tags,
        isPublic,
        defaultDuration: defaultDuration ? parseInt(defaultDuration) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        complexity,
        createdById: user.id,
        
        // Create phases
        phases: {
          create: phases.map((phase: any, index: number) => ({
            name: phase.name,
            description: phase.description,
            order: index + 1,
            estimatedDays: phase.estimatedDays ? parseInt(phase.estimatedDays) : null
          }))
        },
        
        // Create milestones
        milestones: {
          create: milestones.map((milestone: any) => ({
            title: milestone.title,
            description: milestone.description,
            daysFromStart: parseInt(milestone.daysFromStart),
            isRequired: milestone.isRequired !== false
          }))
        }
      },
      include: {
        phases: true,
        milestones: true
      }
    })
    
    // Create tasks with phase relationships
    if (tasks.length > 0) {
      const createdPhases = template.phases
      
      for (const task of tasks) {
        const phaseId = task.phaseIndex !== undefined && createdPhases[task.phaseIndex] 
          ? createdPhases[task.phaseIndex].id 
          : null
        
        await prisma.templateTask.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority || 'MEDIUM',
            estimatedHours: task.estimatedHours ? parseFloat(task.estimatedHours) : null,
            storyPoints: task.storyPoints ? parseInt(task.storyPoints) : null,
            dependsOn: task.dependsOn || [],
            isOptional: task.isOptional || false,
            autoAssign: task.autoAssign || false,
            requiresReview: task.requiresReview || false,
            templateId: template.id,
            phaseId
          }
        })
      }
    }
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'template_created',
        details: {
          templateId: template.id,
          templateName: template.name,
          category: template.category
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        category: template.category
      },
      message: 'Template created successfully'
    })

  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
