import type {Metadata} from 'next';
import './globals.css';
import { PWARegister } from '@/components/PWARegister'; // Global styles

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Controle do Lar' },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  title: 'Controle do Lar - Gestão Financeira Doméstica',
  description: 'Controle financeiro compartilhado para casas e famílias com receitas, despesas por período (mês, semana, dia), divisão entre moradores, lembretes de despesas fixas, metas de economia e relatórios em PDF com comprovantes.',
  openGraph: {
    title: 'Controle do Lar - Gestão Financeira Doméstica',
    description: 'Controle de receitas e despesas compartilhadas, contas a pagar, comprovantes e metas da casa.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Controle do Lar - Gestão Financeira Doméstica',
    description: 'Controle de receitas e despesas compartilhadas da casa com gráficos, lembretes e relatórios.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white min-h-screen">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
