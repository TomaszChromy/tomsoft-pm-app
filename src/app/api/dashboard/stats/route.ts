import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get all projects based on user role
    const projectsWhere = user.role === 'CLIENT' 
      ? { clientId: user.id }
      : user.role === 'ADMIN' 
        ? {}
        : {
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id } } }
            ]
          }

    // Get project statistics
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      projects,
      totalUsers
    ] = await Promise.all([
      prisma.project.count({ where: projectsWhere }),
      prisma.project.count({ 
        where: { ...projectsWhere, status: 'ACTIVE' } 
      }),
      prisma.project.count({ 
        where: { ...projectsWhere, status: 'COMPLETED' } 
      }),
      prisma.project.findMany({
        where: projectsWhere,
        include: {
          tasks: {
            select: {
              id: true,
              status: true
            }
          }
        }
      }),
      user.role === 'ADMIN' 
        ? prisma.user.count({ where: { isActive: true } })
        : prisma.projectMember.count({
            where: {
              project: projectsWhere
            },
            distinct: ['userId']
          })
    ])

    // Calculate task statistics
    let totalTasks = 0
    let completedTasks = 0
    let totalProgress = 0

    projects.forEach(project => {
      const projectTasks = project.tasks.length
      const projectCompletedTasks = project.tasks.filter(task => task.status === 'DONE').length
      
      totalTasks += projectTasks
      completedTasks += projectCompletedTasks
      
      if (projectTasks > 0) {
        totalProgress += (projectCompletedTasks / projectTasks) * 100
      }
    })

    const overallProgress = projects.length > 0 
      ? Math.round(totalProgress / projects.length)
      : 0

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      teamMembers: totalUsers,
      overallProgress
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}
