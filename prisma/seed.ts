import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedGuruPassword = await bcrypt.hash('guru12345', 10)
  const hashedSiswaPassword = await bcrypt.hash('siswa12345', 10)

  // Guru
  await prisma.user.upsert({
    where: { nisNip: '199007092024211023' },
    update: {},
    create: {
      name: 'Suryadi, S.Pd',
      nisNip: '199007092024211023',
      password: hashedGuruPassword,
      role: 'GURU',
    },
  })

  // Kelas XI F1
  const kelasXIF1 = await prisma.kelas.create({
    data: { nama: 'XI F1' }
  })

  // Siswa
  const siswaData = [
    'ALVIN JULIANDI', 'AFRIGAMA FAJAR', 'ALVEMB RIZKY', 'AULIA PUTRI YENTI', 
    'BIAN PUTRA PRATAMA', 'DAVIT AROHMAN DANI', 'M. DAFA RAMADHAN', 'ELSA DELVA NOVRIANI'
  ]

  for (const nama of siswaData) {
    await prisma.user.create({
      data: {
        name: nama,
        nisNip: nama.replace(/ /g, '').substring(0, 10).toUpperCase(),
        password: hashedSiswaPassword,
        role: 'SISWA',
        kelasId: kelasXIF1.id
      }
    })
  }

  console.log('Seed selesai')
}
main()
