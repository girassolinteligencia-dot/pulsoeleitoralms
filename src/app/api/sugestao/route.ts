import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getResend } from '@/lib/mailer';

export async function GET() {
  try {
    const categorias: string[] = [];
    const [temCandidatos, temOrgaos, temServicos] = await Promise.all([
      prisma.candidato.count({ where: { status: 'Ativo' } }),
      prisma.orgaoPublico.count({ where: { status: 'Ativo' } }),
      prisma.servicoPublico.count({ where: { status: 'Ativo' } }),
    ]);
    if (temCandidatos > 0) categorias.push('Político');
    if (temOrgaos > 0) categorias.push('Órgão Público');
    if (temServicos > 0) categorias.push('Serviço Público');
    return NextResponse.json({ categorias });
  } catch {
    return NextResponse.json({ categorias: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { categoria, nome, cargo, municipio } = await req.json();

    if (!categoria || !nome?.trim() || !municipio?.trim()) {
      return NextResponse.json({ error: 'Campos obrigatórios: categoria, nome, município.' }, { status: 400 });
    }

    const params = await prisma.parametroPlataforma.findMany({
      where: {
        chave: {
          in: ['sugestao_email_destino', 'sugestao_assunto_email'],
        },
      },
    });
    const get = (chave: string) => params.find(p => p.chave === chave)?.valor as string | undefined;

    const emailDestino = get('sugestao_email_destino') || 'girassolinteligencia@gmail.com';
    const assunto = get('sugestao_assunto_email') || 'Nova Sugestão de Cadastro — Pulso MS';

    const linhas = [
      `<b>Categoria:</b> ${categoria}`,
      `<b>Nome:</b> ${nome.trim()}`,
      cargo?.trim() ? `<b>Cargo:</b> ${cargo.trim()}` : null,
      `<b>Município:</b> ${municipio.trim()}`,
      `<br/><small>Enviado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' })}</small>`,
    ].filter(Boolean).join('<br/>');

    const resend = getResend();
    const { error: sendError } = await resend.emails.send({
      from: 'Pulso MS <onboarding@resend.dev>',
      to: [emailDestino],
      subject: assunto,
      html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${linhas}</div>`,
    });
    if (sendError) throw new Error(sendError.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[sugestao] erro ao enviar email:', error);
    return NextResponse.json({ error: 'Erro ao enviar sugestão.' }, { status: 500 });
  }
}
