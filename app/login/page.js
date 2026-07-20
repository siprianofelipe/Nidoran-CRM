'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) {
      setErro('E-mail ou senha inválidos. Verifique se o usuário já foi criado no Supabase (Authentication > Users).');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 15% 20%, rgba(180,134,58,0.12), transparent 40%), radial-gradient(circle at 85% 80%, rgba(78,107,79,0.12), transparent 40%), #10233B',
      }}
    >
      <form
        onSubmit={entrar}
        className="card"
        style={{ width: 380, maxWidth: '90vw', padding: '44px 38px 36px' }}
      >
        <div className="brand" style={{ marginBottom: 30 }}>
          <div className="glyph">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z" />
            </svg>
          </div>
          <span style={{ color: '#10233B' }}>Nidoran Seguros</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 500, marginBottom: 6 }}>Acessar o painel</h1>
        <p style={{ color: 'var(--slate)', fontSize: 13.5, marginBottom: 28 }}>
          Entre com suas credenciais de administrador.
        </p>
        <div className="field">
          <label>E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@nidoranseguros.com.br" />
        </div>
        <div className="field">
          <label>Senha</label>
          <input type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" />
        </div>
        {erro && <p style={{ color: 'var(--rust)', fontSize: 12.5, marginBottom: 14 }}>{erro}</p>}
        <button className="btn btn-primary" style={{ width: '100%', padding: 12 }} disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
        <p style={{ marginTop: 18, fontSize: 12, color: 'var(--slate)', textAlign: 'center' }}>
          Usuários são criados no painel do Supabase, em Authentication.
        </p>
      </form>
    </div>
  );
}
