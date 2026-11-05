import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const prisma = new PrismaClient();

async function diagnostico() {
  console.log('=== DIAGNÓSTICO PULSO ELEITORAL ===\n');

  // 1. Testar conexão
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexão com banco OK');
  } catch (e: any) {
    console.log('❌ FALHA NA CONEXÃO:', e.message);
    return;
  }

  // 2. Verificar tabelas existentes
  try {
    const tables = await prisma.$queryRaw<{tablename: string}[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    console.log('\n📋 Tabelas no schema public:');
    tables.forEach(t => console.log(`   - ${t.tablename}`));
  } catch (e: any) {
    console.log('❌ Erro ao listar tabelas:', e.message);
  }

  // 3. Contar candidatos total
  try {
    const total = await prisma.candidato.count();
    console.log(`\n👥 Total de candidatos na tabela: ${total}`);
  } catch (e: any) {
    console.log('❌ Erro ao contar candidatos:', e.message);
  }

  // 4. Contar por ano
  try {
    const porAno = await prisma.$queryRaw<{ano_eleicao: number, total: bigint}[]>`
      SELECT ano_eleicao, COUNT(*) as total FROM candidatos GROUP BY ano_eleicao ORDER BY ano_eleicao
    `;
    console.log('\n📊 Candidatos por ano de eleição:');
    porAno.forEach(r => console.log(`   ${r.ano_eleicao}: ${r.total} candidatos`));
  } catch (e: any) {
    console.log('❌ Erro ao contar por ano:', e.message);
  }

  // 5. Verificar campanhas
  try {
    const campanhas = await prisma.campanha.findMany();
    console.log(`\n📢 Campanhas existentes: ${campanhas.length}`);
    campanhas.forEach(c => console.log(`   - [${c.id}] ${c.nome} (slug: ${c.slug}, status: ${c.status})`));
  } catch (e: any) {
    console.log('❌ Erro ao buscar campanhas:', e.message);
  }

  // 6. Verificar atributos
  try {
    const atributos = await prisma.atributo.count();
    console.log(`\n🎯 Total de atributos: ${atributos}`);
  } catch (e: any) {
    console.log('❌ Erro ao contar atributos:', e.message);
  }

  // 7. Verificar campanha_atributos (vínculo)
  try {
    const vinculos = await prisma.campanhaAtributo.count();
    console.log(`🔗 Total de vínculos campanha-atributo: ${vinculos}`);
  } catch (e: any) {
    console.log('❌ Erro ao contar vínculos:', e.message);
  }

  // 8. Verificar parametros da plataforma
  try {
    const params = await prisma.parametroPlataforma.findMany();
    console.log(`\n⚙️ Parâmetros da plataforma: ${params.length}`);
    params.forEach(p => console.log(`   - ${p.chave} = ${JSON.stringify(p.valor)} (grupo: ${p.grupo})`));
  } catch (e: any) {
    console.log('❌ Erro ao buscar parâmetros:', e.message);
  }

  // 9. Amostra de 5 candidatos
  try {
    const amostra = await prisma.candidato.findMany({ take: 5, include: { campanha: true } });
    console.log('\n🔍 Amostra de candidatos:');
    amostra.forEach(c => console.log(`   - [${c.id}] ${c.nome} | ano: ${c.ano_eleicao} | cargo: ${c.cargo} | cidade: ${c.cidade} | campanha: ${c.campanha?.nome || 'SEM CAMPANHA'}`));
  } catch (e: any) {
    console.log('❌ Erro ao buscar amostra:', e.message);
  }

  // 10. Verificar RLS policies
  try {
    const policies = await prisma.$queryRaw<{tablename: string, policyname: string}[]>`
      SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    `;
    console.log(`\n🔒 Políticas RLS ativas: ${policies.length}`);
    policies.forEach(p => console.log(`   - ${p.tablename}: ${p.policyname}`));
  } catch (e: any) {
    console.log('❌ Erro ao verificar RLS:', e.message);
  }

  // 11. Verificar se RLS está habilitado nas tabelas
  try {
    const rlsStatus = await prisma.$queryRaw<{relname: string, relrowsecurity: boolean}[]>`
      SELECT relname, relrowsecurity FROM pg_class 
      WHERE relname IN ('candidatos', 'campanhas', 'atributos', 'campanha_atributos', 'avaliacoes', 'parametros_plataforma')
    `;
    console.log('\n🛡️ Status RLS por tabela:');
    rlsStatus.forEach(r => console.log(`   - ${r.relname}: RLS ${r.relrowsecurity ? '🔴 ATIVADO' : '🟢 Desativado'}`));
  } catch (e: any) {
    console.log('❌ Erro ao verificar status RLS:', e.message);
  }

  console.log('\n=== FIM DO DIAGNÓSTICO ===');
}

diagnostico()
  .catch(e => console.error('❌ Erro fatal:', e))
  .finally(() => prisma.$disconnect());
