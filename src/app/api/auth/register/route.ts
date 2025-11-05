import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  username: z.string().min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki'),
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT', 'VIEWER']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { error: 'Użytkownik z tym adresem email już istnieje' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Nazwa użytkownika jest już zajęta' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        role: validatedData.role || 'DEVELOPER',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      message: 'Konto zostało utworzone pomyślnie',
      user,
      token,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Błąd walidacji danych', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia konta' },
      { status: 500 }
    )
  }
}
