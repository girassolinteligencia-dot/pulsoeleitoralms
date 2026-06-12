import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // 1. Create Attributes
  const attrTransparencia = await prisma.atributo.upsert({
    where: { nome: 'Transparência' },
    update: {},
    create: { nome: 'Transparência' },
  })

  const attrEficiencia = await prisma.atributo.upsert({
    where: { nome: 'Eficiência' },
    update: {},
    create: { nome: 'Eficiência' },
  })

  const attrInovacao = await prisma.atributo.upsert({
    where: { nome: 'Inovação' },
    update: {},
    create: { nome: 'Inovação' },
  })

  // 2. Create Campaign
  const campanha = await prisma.campanha.upsert({
    where: { slug: 'ms-2026' },
    update: {},
    create: {
      nome: 'Eleições MS 2026',
      slug: 'ms-2026',
    },
  })

  // 3. Link Attributes to Campaign
  await prisma.campanhaAtributo.createMany({
    data: [
      { campanha_id: campanha.id, atributo_id: attrTransparencia.id },
      { campanha_id: campanha.id, atributo_id: attrEficiencia.id },
      { campanha_id: campanha.id, atributo_id: attrInovacao.id },
    ],
    skipDuplicates: true,
  })

  // 4. Create Candidates
  await prisma.candidato.upsert({
    where: { id: 'cand-1' },
    update: {},
    create: {
      id: 'cand-1',
      nome: 'Carlos Governador',
      cargo: 'Governador',
      cidade: 'Campo Grande',
      campanha_id: campanha.id,
    },
  })

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
