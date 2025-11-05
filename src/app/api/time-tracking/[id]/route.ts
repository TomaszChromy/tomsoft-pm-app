import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

const updateTimeEntrySchema = z.object({
  description: z.string().optional(),
  hours: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isRunning: z.boolean().optional(),
  billable: z.boolean().optional(),
  hourlyRate: z.number().optional(),
  tags: z.array(z.string()).optional().transform(tags => tags ? tags.join(',') : undefined)
})

// GET /api/time-tracking/[id] - Get specific time entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        ...(user.role === 'DEVELOPER' && { userId: user.id }),
        ...(user.role === 'CLIENT' && { project: { clientId: user.id } })
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    return NextResponse.json({
      timeEntry: {
        ...timeEntry,
        tags: timeEntry.tags ? timeEntry.tags.split(',').filter((tag: string) => tag.trim()) : []
      }
    })
  } catch (error) {
    console.error('Time tracking GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/time-tracking/[id] - Update time entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateTimeEntrySchema.parse(body)

    // Check if time entry exists and user has access
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        ...(user.role === 'DEVELOPER' && { userId: user.id })
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Time entry not found or access denied' }, { status: 404 })
    }

    // Calculate hours if start/end time provided
    let hours = validatedData.hours
    if (validatedData.startTime && validatedData.endTime && !validatedData.isRunning) {
      const start = new Date(validatedData.startTime)
      const end = new Date(validatedData.endTime)
      hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert to hours
    }

    // If stopping a running timer, calculate hours from start time
    if (existingEntry.isRunning && validatedData.isRunning === false && existingEntry.startTime) {
      const start = existingEntry.startTime
      const end = validatedData.endTime ? new Date(validatedData.endTime) : new Date()
      hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }

    const updateData: any = {}
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (hours !== undefined) updateData.hours = hours
    if (validatedData.startTime !== undefined) updateData.startTime = new Date(validatedData.startTime)
    if (validatedData.endTime !== undefined) updateData.endTime = new Date(validatedData.endTime)
    if (validatedData.isRunning !== undefined) updateData.isRunning = validatedData.isRunning
    if (validatedData.billable !== undefined) updateData.billable = validatedData.billable
    if (validatedData.hourlyRate !== undefined) updateData.hourlyRate = validatedData.hourlyRate
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags

    // If stopping timer, set end time
    if (validatedData.isRunning === false && !validatedData.endTime) {
      updateData.endTime = new Date()
    }

    const timeEntry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      timeEntry: {
        ...timeEntry,
        tags: timeEntry.tags ? timeEntry.tags.split(',').filter((tag: string) => tag.trim()) : []
      }
    })
  } catch (error) {
    console.error('Time tracking PUT error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-tracking/[id] - Delete time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getUserFromToken(request.headers.get('authorization')?.replace('Bearer ', '') || '')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if time entry exists and user has access
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id: params.id,
        ...(user.role === 'DEVELOPER' && { userId: user.id })
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Time entry not found or access denied' }, { status: 404 })
    }

    await prisma.timeEntry.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Time entry deleted successfully' })
  } catch (error) {
    console.error('Time tracking DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
