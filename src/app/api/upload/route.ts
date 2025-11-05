import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { handleFileUpload } from '@/lib/upload'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'attachment'
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')

    // Handle file upload
    const uploadResult = await handleFileUpload(request, 'files')
    
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 })
    }

    const uploadedFiles = uploadResult.files || []
    const attachments = []

    // Save attachment records to database
    for (const file of uploadedFiles) {
      let attachment = null

      if (type === 'avatar') {
        // Update user avatar
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: file.path }
        })
        
        attachment = {
          id: 'avatar-' + user.id,
          fileName: file.originalName,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: user.id,
          type: 'avatar'
        }
      } else {
        // Create attachment record
        attachment = await prisma.attachment.create({
          data: {
            fileName: file.originalName,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedById: user.id,
            ...(taskId && { taskId }),
            ...(projectId && { projectId })
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        })
      }

      attachments.push(attachment)
    }

    return NextResponse.json({
      success: true,
      message: `Przesłano ${uploadedFiles.length} plików`,
      attachments
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get attachments
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type')

    const where: any = {}
    
    if (taskId) where.taskId = taskId
    if (projectId) where.projectId = projectId
    if (type) where.type = type

    const attachments = await prisma.attachment.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Get attachments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
