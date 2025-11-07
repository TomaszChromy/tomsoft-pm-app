import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/templates/[id]/apply - Apply template to create new project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const templateId = params.id
    
    const body = await request.json()
    const {
      projectName,
      projectDescription,
      startDate,
      clientId,
      teamMembers = [],
      customizations = {}
    } = body
    
    // Validate required fields
    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    // Get template with all related data
    const template = await prisma.projectTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { isPublic: true },
          { createdById: user.id }
        ]
      },
      include: {
        phases: {
          include: {
            tasks: true,
            milestones: true
          },
          orderBy: { order: 'asc' }
        },
        tasks: {
          where: { phaseId: null }
        },
        milestones: {
          where: { phaseId: null }
        }
      }
    })
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    
    const projectStartDate = startDate ? new Date(startDate) : new Date()
    
    // Calculate project end date
    const projectEndDate = template.defaultDuration 
      ? new Date(projectStartDate.getTime() + (template.defaultDuration * 24 * 60 * 60 * 1000))
      : null
    
    // Create project from template
    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: projectDescription || template.description,
        status: 'PLANNING',
        startDate: projectStartDate,
        endDate: projectEndDate,
        estimatedHours: template.estimatedHours,
        ownerId: user.id,
        clientId: clientId || null,
        
        // Add team members
        team: teamMembers.length > 0 ? {
          connect: teamMembers.map((memberId: string) => ({ id: memberId }))
        } : undefined
      }
    })
    
    // Create sprints from phases
    const sprintMap = new Map<string, string>()
    
    for (const phase of template.phases) {
      const sprintStartDate = new Date(projectStartDate)
      const sprintEndDate = phase.estimatedDays 
        ? new Date(sprintStartDate.getTime() + (phase.estimatedDays * 24 * 60 * 60 * 1000))
        : new Date(sprintStartDate.getTime() + (14 * 24 * 60 * 60 * 1000)) // Default 2 weeks
      
      const sprint = await prisma.sprint.create({
        data: {
          name: phase.name,
          description: phase.description,
          startDate: sprintStartDate,
          endDate: sprintEndDate,
          projectId: project.id
        }
      })
      
      sprintMap.set(phase.id, sprint.id)
    }
    
    // Create tasks from template
    const taskMap = new Map<string, string>()
    
    // First, create tasks without dependencies
    const allTemplateTasks = [
      ...template.tasks,
      ...template.phases.flatMap(phase => phase.tasks)
    ]
    
    for (const templateTask of allTemplateTasks) {
      const sprintId = templateTask.phaseId ? sprintMap.get(templateTask.phaseId) : null
      
      // Calculate due date based on project start and estimated hours
      let dueDate = null
      if (templateTask.estimatedHours) {
        const daysToAdd = Math.ceil(templateTask.estimatedHours / 8) // Assuming 8 hours per day
        dueDate = new Date(projectStartDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))
      }
      
      const task = await prisma.task.create({
        data: {
          title: templateTask.title,
          description: templateTask.description,
          priority: templateTask.priority,
          estimatedHours: templateTask.estimatedHours,
          storyPoints: templateTask.storyPoints,
          dueDate,
          projectId: project.id,
          sprintId,
          assigneeId: templateTask.autoAssign ? user.id : null,
          createdById: user.id
        }
      })
      
      taskMap.set(templateTask.id, task.id)
    }
    
    // Update task dependencies
    for (const templateTask of allTemplateTasks) {
      if (templateTask.dependsOn.length > 0) {
        const dependencyIds = templateTask.dependsOn
          .map(depId => taskMap.get(depId))
          .filter(Boolean)
        
        if (dependencyIds.length > 0) {
          await prisma.task.update({
            where: { id: taskMap.get(templateTask.id)! },
            data: {
              dependencies: {
                connect: dependencyIds.map(id => ({ id }))
              }
            }
          })
        }
      }
    }
    
    // Create milestones from template
    const allTemplateMilestones = [
      ...template.milestones,
      ...template.phases.flatMap(phase => phase.milestones)
    ]
    
    for (const templateMilestone of allTemplateMilestones) {
      const milestoneDate = new Date(
        projectStartDate.getTime() + (templateMilestone.daysFromStart * 24 * 60 * 60 * 1000)
      )
      
      await prisma.milestone.create({
        data: {
          title: templateMilestone.title,
          description: templateMilestone.description,
          dueDate: milestoneDate,
          projectId: project.id
        }
      })
    }
    
    // Update template usage count
    await prisma.projectTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'project_created_from_template',
        details: {
          projectId: project.id,
          projectName: project.name,
          templateId,
          templateName: template.name
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        projectId: project.id,
        projectName: project.name,
        tasksCreated: allTemplateTasks.length,
        milestonesCreated: allTemplateMilestones.length,
        sprintsCreated: template.phases.length
      },
      message: 'Project created successfully from template'
    })

  } catch (error) {
    console.error('Template application error:', error)
    return NextResponse.json(
      { error: 'Failed to create project from template' },
      { status: 500 }
    )
  }
}
