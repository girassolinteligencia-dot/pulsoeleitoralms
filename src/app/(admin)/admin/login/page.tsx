import { redirect } from 'next/navigation';

// O login do admin é feito pelo Cloudflare Access (código por e-mail) antes de qualquer
// página de /admin carregar. Esta rota existe só para links antigos.
export default function AdminLoginPage() {
  redirect('/admin/dashboard');
}
