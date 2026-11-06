import { redirect } from 'next/navigation';

export default function BloqueiosRedirect() {
  redirect('/admin/sistema?aba=seguranca');
}
