'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/comissionamento', label: 'Comissionamento' },
  { href: '/tarefas', label: 'Tarefas do dia' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/apolices', label: 'Apólices' },
  { href: '/financeiro', label: 'Financeiro' },
  { href: '/marketing', label: 'Marketing' },
  { href: '/ia', label: 'Assistente IA' },
];

export default function ProtectedLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checando, setChecando] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      } else {
        setEmail(data.session.user.email);
        setChecando(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (checando) {
    return <div style={{ padding: 40, color: 'var(--slate)' }}>Carregando...</div>;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="glyph">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z" />
            </svg>
          </div>
          <span>Nidoran Seguros</span>
        </div>
        <nav className="mainnav">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="foot">
          <div className="user">
            <b>{email.split('@')[0]}</b>
            {email}
          </div>
          <button onClick={sair}>Sair</button>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
