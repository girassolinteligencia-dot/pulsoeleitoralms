import { NextRequest, NextResponse } from 'next/server';
import { getAdminIdentity } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  const auth = await getAdminIdentity(req);
  if ('error' in auth) return auth.error;

  return NextResponse.json({
    id: auth.adminUserId,
    auth_id: auth.id,
    email: auth.email,
    nome: auth.nome,
    role: auth.role,
  });
}
