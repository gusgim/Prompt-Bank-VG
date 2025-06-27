import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding ...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123!', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@promptbank.com' },
    update: {},
    create: {
      email: 'admin@promptbank.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Created or found admin user: ${adminUser.email}`)

  // Create demo user
  const demoHashedPassword = await bcrypt.hash('demo123!', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@promptbank.com' },
    update: {},
    create: {
      email: 'demo@promptbank.com',
      name: 'Demo User',
      password: demoHashedPassword,
      role: 'USER',
    },
  })
  console.log(`Created or found demo user: ${demoUser.email}`)

  // Create default tags for admin
  const defaultTag = await prisma.tag.upsert({
    where: { 
      name_userId: {
        name: 'general',
        userId: adminUser.id
      }
    },
    update: {},
    create: { 
      name: 'general',
      userId: adminUser.id
    },
  })
  console.log(`Created or found tag: ${defaultTag.name} for admin`)

  // Create additional tags for admin
  const codingTag = await prisma.tag.upsert({
    where: { 
      name_userId: {
        name: 'coding',
        userId: adminUser.id
      }
    },
    update: {},
    create: { 
      name: 'coding',
      userId: adminUser.id
    },
  })

  const writingTag = await prisma.tag.upsert({
    where: { 
      name_userId: {
        name: 'writing',
        userId: adminUser.id
      }
    },
    update: {},
    create: { 
      name: 'writing',
      userId: adminUser.id
    },
  })

  // Check if a prompt with the category "General" already exists for admin
  const existingPrompt = await prisma.prompt.findFirst({
    where: { 
      category: 'General',
      userId: adminUser.id
    },
  })

  // Only create the welcome prompt if no prompts in the "General" category exist for admin
  if (!existingPrompt) {
    const welcomePrompt = await prisma.prompt.create({
      data: {
        title: 'Welcome to Prompt Bank!',
        content: 'This is an example prompt to get you started. You can edit or delete it later.',
        category: 'General',
        userId: adminUser.id,
        tags: {
          connect: { id: defaultTag.id },
        },
      },
    })
    console.log(`Created welcome prompt: "${welcomePrompt.title}" for admin`)

    // Create additional sample prompts
    await prisma.prompt.create({
      data: {
        title: 'Code Review Assistant',
        content: 'Please review the following code and provide feedback on:\n1. Code quality and best practices\n2. Potential bugs or issues\n3. Performance improvements\n4. Readability and maintainability\n\nCode:\n[INSERT CODE HERE]',
        category: 'Development',
        subCategory: 'Code Review',
        userId: adminUser.id,
        tags: {
          connect: { id: codingTag.id },
        },
      },
    })

    await prisma.prompt.create({
      data: {
        title: 'Blog Post Writer',
        content: 'Write a comprehensive blog post about [TOPIC]. Include:\n1. An engaging introduction\n2. 3-5 main points with examples\n3. A compelling conclusion\n4. SEO-friendly headings\n\nTarget audience: [AUDIENCE]\nTone: [TONE]\nWord count: [WORD COUNT]',
        category: 'Content Creation',
        subCategory: 'Blog Writing',
        userId: adminUser.id,
        tags: {
          connect: { id: writingTag.id },
        },
      },
    })

    console.log('Created additional sample prompts for admin')
  } else {
    console.log('A prompt in the "General" category already exists for admin. Skipping seed prompt creation.')
  }

  // Create sample data for demo user
  const demoTag = await prisma.tag.create({
    data: {
      name: 'personal',
      userId: demoUser.id
    }
  })

  await prisma.prompt.create({
    data: {
      title: 'Daily Journal Prompt',
      content: 'Reflect on your day by answering these questions:\n1. What went well today?\n2. What challenges did you face?\n3. What did you learn?\n4. What are you grateful for?\n5. What will you do differently tomorrow?',
      category: 'Personal',
      subCategory: 'Journaling',
      userId: demoUser.id,
      tags: {
        connect: { id: demoTag.id },
      },
    },
  })

  console.log('Created sample data for demo user')

  // 테스트용 초대 코드 생성
  const testInviteCode = await prisma.inviteCode.create({
    data: {
      code: 'TESTCODE',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 후 만료
      createdById: adminUser.id
    }
  })

  console.log('Created test invite code: TESTCODE')
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 