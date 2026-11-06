import { redirect } from 'next/navigation';

export default function AuditoriaRedirect() {
  redirect('/admin/sistema?aba=auditoria');
}
