import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('guru12345', 10)
  
  // Buat Kelas XI
  const kelasXI = await prisma.kelas.upsert({
    where: { nama: 'XI IPA 1' },
    update: {},
    create: { nama: 'XI IPA 1' }
  })

  // Buat Akun Guru
  await prisma.user.upsert({
    where: { nisNip: '199007092024211023' },
    update: {},
    create: {
      name: 'Guru Mulok',
      nisNip: '199007092024211023',
      password: hashedPassword,
      role: 'GURU'
    }
  })

  console.log('Seeding berhasil!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
