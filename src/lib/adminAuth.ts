import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export type AdminIdentity = {
  id: string;
  email: string;
};

const DEFAULT_ADMIN_EMAILS = [
  'admin@pulsoeleitoral.ms',
  'paulo@pulsoeleitoral.ms',
  'paulofernandogarciacardoso@gmail.com',
  'girassolinteligencia@gmail.com',
];

function getAllowedEmails() {
  const configured = process.env.ADMIN_EMAILS;
  if (!configured) return DEFAULT_ADMIN_EMAILS;

  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(req: Request) {
  const result = await getAdminIdentity(req);
  return 'error' in result ? result.error : null;
}

export async function getAdminIdentity(req: Request): Promise<AdminIdentity | { error: NextResponse }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: NextResponse.json({ error: 'Auth server is not configured' }, { status: 500 }) };
  }

  if (!token) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  const userId = data.user?.id;
  const email = data.user?.email?.toLowerCase().trim();

  if (error || !userId || !email) {
    return { error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }

  if (!getAllowedEmails().includes(email)) {
    return { error: NextResponse.json({ error: 'Admin access denied' }, { status: 403 }) };
  }

  return { id: userId, email };
}
