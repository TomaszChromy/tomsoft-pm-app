import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/templates/[id] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const templateId = params.id
    
    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { createdById: user.id }
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        phases: {
          include: {
            tasks: {
              orderBy: { createdAt: 'asc' }
            },
            milestones: {
              orderBy: { daysFromStart: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        tasks: {
          where: { phaseId: null },
          orderBy: { createdAt: 'asc' }
        },
        milestones: {
          where: { phaseId: null },
          orderBy: { daysFromStart: 'asc' }
        }
      }
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Template fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const templateId = params.id
    
    // Check if user owns the template
    const existingTemplate = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        createdById: user.id
      }
    })
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const {
      name,
      description,
      category,
      tags,
      isPublic,
      defaultDuration,
      estimatedHours,
      complexity
    } = body
    
    const updatedTemplate = await prisma.projectTemplate.update({
      where: { id: templateId },
      data: {
        name,
        description,
        category,
        tags,
        isPublic,
        defaultDuration: defaultDuration ? parseInt(defaultDuration) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        complexity
      }
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'template_updated',
        details: {
          templateId,
          templateName: updatedTemplate.name
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    })

  } catch (error) {
    console.error('Template update error:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const templateId = params.id
    
    // Check if user owns the template
    const existingTemplate = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        createdById: user.id
      }
    })
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }
    
    // Delete template (cascade will handle related records)
    await prisma.projectTemplate.delete({
      where: { id: templateId }
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'template_deleted',
        details: {
          templateId,
          templateName: existingTemplate.name
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Template deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
