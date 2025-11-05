import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tomsoft.pl' },
    update: {},
    create: {
      email: 'admin@tomsoft.pl',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'TomSoft',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
  })

  const pm = await prisma.user.upsert({
    where: { email: 'pm@tomsoft.pl' },
    update: {},
    create: {
      email: 'pm@tomsoft.pl',
      username: 'projectmanager',
      firstName: 'Anna',
      lastName: 'Kowalska',
      password: hashedPassword,
      role: 'PROJECT_MANAGER',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    },
  })

  const dev1 = await prisma.user.upsert({
    where: { email: 'dev@tomsoft.pl' },
    update: {},
    create: {
      email: 'dev@tomsoft.pl',
      username: 'developer',
      firstName: 'Tomasz',
      lastName: 'Nowak',
      password: hashedPassword,
      role: 'DEVELOPER',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
  })

  const dev2 = await prisma.user.upsert({
    where: { email: 'maria@tomsoft.pl' },
    update: {},
    create: {
      email: 'maria@tomsoft.pl',
      username: 'maria',
      firstName: 'Maria',
      lastName: 'Wiśniewska',
      password: hashedPassword,
      role: 'DEVELOPER',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      username: 'client',
      firstName: 'Jan',
      lastName: 'Klient',
      password: hashedPassword,
      role: 'CLIENT',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    },
  })

  console.log('✅ Users created')

  // Create demo clients
  const clientCompany1 = await prisma.client.upsert({
    where: { email: 'contact@techcorp.com' },
    update: {},
    create: {
      name: 'TechCorp Solutions',
      email: 'contact@techcorp.com',
      phone: '+48 123 456 789',
      company: 'TechCorp Solutions Sp. z o.o.',
      address: 'ul. Technologiczna 15, 00-001 Warszawa',
      website: 'https://techcorp.com',
      description: 'Leading technology solutions provider',
    },
  })

  const clientCompany2 = await prisma.client.upsert({
    where: { email: 'hello@startup.io' },
    update: {},
    create: {
      name: 'Startup Innovation',
      email: 'hello@startup.io',
      phone: '+48 987 654 321',
      company: 'Startup Innovation Ltd.',
      address: 'ul. Innowacyjna 7, 02-001 Kraków',
      website: 'https://startup.io',
      description: 'Innovative startup focused on digital transformation',
    },
  })

  console.log('✅ Clients created')

  // Create demo projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      description: 'Modern e-commerce platform with advanced features',
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2024-01-15'),
      deadline: new Date('2024-06-30'),
      budget: 150000,
      spent: 45000,
      progress: 65,
      ownerId: pm.id,
      clientId: clientCompany1.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Cross-platform mobile application for iOS and Android',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      startDate: new Date('2024-02-01'),
      deadline: new Date('2024-08-15'),
      budget: 80000,
      spent: 25000,
      progress: 40,
      ownerId: pm.id,
      clientId: clientCompany2.id,
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of corporate website',
      status: 'PLANNING',
      priority: 'LOW',
      startDate: new Date('2024-03-01'),
      deadline: new Date('2024-05-30'),
      budget: 25000,
      spent: 0,
      progress: 15,
      ownerId: pm.id,
      clientId: clientCompany1.id,
    },
  })

  console.log('✅ Projects created')

  // Add project members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: dev1.id, role: 'LEAD' },
      { projectId: project1.id, userId: dev2.id, role: 'MEMBER' },
      { projectId: project2.id, userId: dev1.id, role: 'MEMBER' },
      { projectId: project2.id, userId: dev2.id, role: 'LEAD' },
      { projectId: project3.id, userId: dev1.id, role: 'LEAD' },
    ],
  })

  console.log('✅ Project members added')

  // Create demo tasks
  const tasks = [
    // E-commerce Platform tasks
    {
      title: 'Setup project infrastructure',
      description: 'Initialize project repository, CI/CD pipeline, and development environment',
      status: 'DONE',
      priority: 'HIGH',
      estimatedHours: 16,
      actualHours: 14,
      projectId: project1.id,
      assigneeId: dev1.id,
      position: 1,
    },
    {
      title: 'Design database schema',
      description: 'Create comprehensive database schema for e-commerce platform',
      status: 'DONE',
      priority: 'HIGH',
      estimatedHours: 24,
      actualHours: 28,
      projectId: project1.id,
      assigneeId: dev1.id,
      position: 2,
    },
    {
      title: 'Implement user authentication',
      description: 'Build secure user authentication and authorization system',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 32,
      actualHours: 18,
      projectId: project1.id,
      assigneeId: dev2.id,
      position: 3,
    },
    {
      title: 'Create product catalog',
      description: 'Develop product listing, search, and filtering functionality',
      status: 'TODO',
      priority: 'MEDIUM',
      estimatedHours: 40,
      projectId: project1.id,
      assigneeId: dev1.id,
      position: 4,
    },
    {
      title: 'Implement shopping cart',
      description: 'Build shopping cart and checkout process',
      status: 'TODO',
      priority: 'HIGH',
      estimatedHours: 36,
      projectId: project1.id,
      assigneeId: dev2.id,
      position: 5,
    },
    // Mobile App tasks
    {
      title: 'Mobile app wireframes',
      description: 'Create detailed wireframes for all app screens',
      status: 'DONE',
      priority: 'HIGH',
      estimatedHours: 20,
      actualHours: 22,
      projectId: project2.id,
      assigneeId: dev2.id,
      position: 1,
    },
    {
      title: 'Setup React Native project',
      description: 'Initialize React Native project with navigation and state management',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedHours: 16,
      actualHours: 8,
      projectId: project2.id,
      assigneeId: dev1.id,
      position: 2,
    },
    {
      title: 'Implement user onboarding',
      description: 'Create user registration and onboarding flow',
      status: 'TODO',
      priority: 'MEDIUM',
      estimatedHours: 24,
      projectId: project2.id,
      assigneeId: dev2.id,
      position: 3,
    },
  ]

  for (const taskData of tasks) {
    await prisma.task.create({ data: taskData })
  }

  console.log('✅ Tasks created')

  // Create demo comments
  const comments = [
    {
      content: 'Great progress on the infrastructure setup! The CI/CD pipeline is working perfectly.',
      authorId: pm.id,
      projectId: project1.id,
    },
    {
      content: 'Database schema looks comprehensive. Added some suggestions for optimization.',
      authorId: dev2.id,
      projectId: project1.id,
    },
    {
      content: 'Authentication system is almost ready. Just need to add password reset functionality.',
      authorId: dev2.id,
      projectId: project1.id,
    },
  ]

  for (const commentData of comments) {
    await prisma.comment.create({ data: commentData })
  }

  console.log('✅ Comments created')

  // Create demo notifications
  const notifications = [
    {
      title: 'Welcome to TomSoft PM App!',
      message: 'Your account has been created successfully. Start managing your projects efficiently.',
      type: 'INFO',
      userId: admin.id,
    },
    {
      title: 'New Task Assigned',
      message: 'You have been assigned to task: Implement user authentication',
      type: 'TASK_ASSIGNED',
      userId: dev2.id,
    },
    {
      title: 'Project Update',
      message: 'E-commerce Platform project progress updated to 65%',
      type: 'PROJECT_UPDATE',
      userId: pm.id,
    },
  ]

  for (const notificationData of notifications) {
    await prisma.notification.create({ data: notificationData })
  }

  console.log('✅ Notifications created')

  console.log('🎉 Database seeded successfully!')
  console.log('\n📋 Demo accounts:')
  console.log('👤 Admin: admin@tomsoft.pl / password123')
  console.log('👤 PM: pm@tomsoft.pl / password123')
  console.log('👤 Developer: dev@tomsoft.pl / password123')
  console.log('👤 Developer 2: maria@tomsoft.pl / password123')
  console.log('👤 Client: client@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
