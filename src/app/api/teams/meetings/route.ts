import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { TeamsIntegrationService } from '@/lib/teams-integration'
import { prisma } from '@/lib/prisma'

// POST /api/teams/meetings - Create Teams meeting for project
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const body = await request.json()
    const { projectId, title, participants, startTime, duration, agenda } = body
    
    // Validate project exists and user has access
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
            email: true
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

    // Create Teams meeting
    const meetingResult = await TeamsIntegrationService.createProjectMeeting(
      projectId,
      project.name,
      participants || project.team.map(member => member.email)
    )

    if (!meetingResult.success) {
      return NextResponse.json(
        { error: meetingResult.error || 'Failed to create Teams meeting' },
        { status: 500 }
      )
    }

    // Store meeting information in database
    const meeting = await prisma.meeting.create({
      data: {
        title: title || `${project.name} - Project Discussion`,
        projectId,
        organizerId: user.id,
        startTime: startTime ? new Date(startTime) : new Date(),
        duration: duration || 60,
        agenda: agenda || 'Project discussion and updates',
        teamsUrl: meetingResult.joinUrl,
        teamsMeetingId: meetingResult.meetingId,
        participants: {
          connect: participants 
            ? participants.map((email: string) => ({ email }))
            : project.team.map(member => ({ id: member.id }))
        }
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send Teams notification about the meeting
    await TeamsIntegrationService.sendNotification({
      type: 'MessageCard',
      title: '📅 New Project Meeting Scheduled',
      text: `A new meeting has been scheduled for project "${project.name}"`,
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: meeting.title,
          activitySubtitle: `Organized by ${meeting.organizer.firstName} ${meeting.organizer.lastName}`,
          facts: [
            { name: 'Project', value: project.name },
            { name: 'Date & Time', value: meeting.startTime.toLocaleString() },
            { name: 'Duration', value: `${meeting.duration} minutes` },
            { name: 'Participants', value: meeting.participants.length.toString() }
          ]
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Join Meeting',
          targets: [
            {
              os: 'default',
              uri: meeting.teamsUrl
            }
          ]
        }
      ]
    })

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        duration: meeting.duration,
        teamsUrl: meeting.teamsUrl,
        participants: meeting.participants
      },
      message: 'Teams meeting created successfully'
    })

  } catch (error) {
    console.error('Error creating Teams meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create Teams meeting' },
      { status: 500 }
    )
  }
}

// GET /api/teams/meetings - Get project meetings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    let whereClause: any = {
      OR: [
        { organizerId: user.id },
        { participants: { some: { id: user.id } } }
      ]
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      meetings: meetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        project: meeting.project,
        organizer: meeting.organizer,
        startTime: meeting.startTime,
        duration: meeting.duration,
        agenda: meeting.agenda,
        teamsUrl: meeting.teamsUrl,
        participants: meeting.participants,
        createdAt: meeting.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching Teams meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}
