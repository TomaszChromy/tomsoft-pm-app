import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TeamsIntegrationService } from '@/lib/teams-integration'
import { prisma } from '@/lib/prisma'

// GET /api/teams/presence - Get Teams presence for team members
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const teamIds = searchParams.get('teamIds')?.split(',')
    
    let userIds: string[] = []

    if (projectId) {
      // Get team members from specific project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: user.id },
            { team: { some: { id: user.id } } }
          ]
        },
        include: {
          team: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              teamsUserId: true
            }
          }
        }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        )
      }

      userIds = project.team
        .filter(member => member.teamsUserId)
        .map(member => member.teamsUserId!)
        
    } else if (teamIds) {
      // Get specific team members
      const teamMembers = await prisma.user.findMany({
        where: {
          id: { in: teamIds },
          teamsUserId: { not: null }
        },
        select: {
          teamsUserId: true
        }
      })

      userIds = teamMembers
        .filter(member => member.teamsUserId)
        .map(member => member.teamsUserId!)
        
    } else {
      // Get all team members user has access to
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { team: { some: { id: user.id } } }
          ]
        },
        include: {
          team: {
            select: {
              teamsUserId: true
            }
          }
        }
      })

      const allTeamMembers = projects.flatMap(project => project.team)
      userIds = [...new Set(allTeamMembers
        .filter(member => member.teamsUserId)
        .map(member => member.teamsUserId!))]
    }

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        presence: [],
        message: 'No team members with Teams integration found'
      })
    }

    // Get presence information from Teams
    const presenceData = await TeamsIntegrationService.getTeamPresence(userIds)
    
    // Enrich with user information from database
    const enrichedPresence = await Promise.all(
      presenceData.map(async (presence: any) => {
        const user = await prisma.user.findFirst({
          where: { teamsUserId: presence.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true
          }
        })

        return {
          ...presence,
          user: user || null
        }
      })
    )

    return NextResponse.json({
      success: true,
      presence: enrichedPresence,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching Teams presence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Teams presence' },
      { status: 500 }
    )
  }
}

// POST /api/teams/presence - Update user's Teams presence mapping
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const { teamsUserId, action } = body
    
    if (action === 'link') {
      // Link current user to Teams user ID
      await prisma.user.update({
        where: { id: user.id },
        data: { teamsUserId }
      })

      return NextResponse.json({
        success: true,
        message: 'Teams account linked successfully'
      })
      
    } else if (action === 'unlink') {
      // Unlink Teams user ID
      await prisma.user.update({
        where: { id: user.id },
        data: { teamsUserId: null }
      })

      return NextResponse.json({
        success: true,
        message: 'Teams account unlinked successfully'
      })
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "link" or "unlink"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating Teams presence mapping:', error)
    return NextResponse.json(
      { error: 'Failed to update Teams presence mapping' },
      { status: 500 }
    )
  }
}
