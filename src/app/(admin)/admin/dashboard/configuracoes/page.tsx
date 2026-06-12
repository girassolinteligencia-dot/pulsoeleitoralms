import { redirect } from 'next/navigation';

export default function ConfiguracoesRedirect() {
  redirect('/admin/sistema?aba=configuracoes');
}
