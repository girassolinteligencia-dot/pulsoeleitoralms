import { NextRequest, NextResponse } from 'next/server';
import { getResend } from '@/lib/mailer';
import { getDb } from '@/server/db/client';
import { categoriasDisponiveis } from '@/server/repos/catalogo';
import { asString, getParametros } from '@/server/repos/parametros';
import { checkRateLimit } from '@/server/rateLimit';
import { clientIp } from '@/server/http';
import { generateSecureHash } from '@/lib/hash';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const campo = (v: unknown, max = 160) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET() {
  try {
    return NextResponse.json({ categorias: await categoriasDisponiveis(getDb()) });
  } catch {
    return NextResponse.json({ categorias: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit('RL_ENVIO', `sugestao:${generateSecureHash(clientIp(req.headers))}`);
    if (!rl.allowed) return NextResponse.json({ error: 'Muitas tentativas em curto período.' }, { status: 429 });

    const body = await req.json();
    const categoria = campo(body.categoria, 40);
    const nome = campo(body.nome);
    const cargo = campo(body.cargo);
    const municipio = campo(body.municipio, 80);
    if (!categoria || !nome || !municipio) {
      return NextResponse.json({ error: 'Campos obrigatórios: categoria, nome, município.' }, { status: 400 });
    }

    const p = await getParametros(getDb(), ['sugestao_email_destino', 'sugestao_assunto_email']);
    const emailDestino = asString(p.get('sugestao_email_destino'), 'girassolinteligencia@gmail.com');
    const assunto = asString(p.get('sugestao_assunto_email'), 'Nova Sugestão de Cadastro — Pulso MS');

    const linhas = [
      `<b>Categoria:</b> ${esc(categoria)}`,
      `<b>Nome:</b> ${esc(nome)}`,
      cargo ? `<b>Cargo:</b> ${esc(cargo)}` : null,
      `<b>Município:</b> ${esc(municipio)}`,
      `<br/><small>Enviado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' })}</small>`,
    ].filter(Boolean).join('<br/>');

    const { error: sendError } = await getResend().emails.send({
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
