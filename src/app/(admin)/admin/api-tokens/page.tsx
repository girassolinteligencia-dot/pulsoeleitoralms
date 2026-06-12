import { redirect } from 'next/navigation';

export default function ApiTokensRedirect() {
  redirect('/admin/sistema?aba=tokens');
}
