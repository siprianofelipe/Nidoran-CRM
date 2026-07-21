'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function fmtBRL(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function AceitePage() {
  const { token } = useParams();
  const [registro, setRegistro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase.from('aceites_corretor').select('*').eq('token', token).single();
    if (error || !data) { setErro('Link inválido ou expirado.'); setCarregando(false); return; }
    setRegistro(data);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, [token]);

  async function confirmarAceite() {
    if (!nome.trim()) { alert('Digite seu nome completo para confirmar.'); return; }
    setEnviando(true);
    const { error } = await supabase.from('aceites_corretor')
      .update({ status: 'Aceito', data_aceite: new Date().toISOString(), nome_confirmado: nome.trim() })
      .eq('token', token);
    setEnviando(false);
    if (error) return alert('Erro ao confirmar: ' + error.message);
    carregar();
  }

  if (carregando) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>Carregando...</div>;
  if (erro) return <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>{erro}</div>;

  const r = registro.resumo;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24 }}>Extrato de comissão</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>{registro.corretor_nome}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Comissão a receber</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtBRL(r.comissao_pendente)}</div>
        </div>
        <div style={{ border: '1px solid #eee', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Saldo líquido</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{fmtBRL(r.saldo_liquido)}</div>
        </div>
      </div>

      {r.parcelas?.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Parcelas de comissão</h3>
          <table style={{ width: '100%', fontSize: 13, marginBottom: 24, borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', color: '#888', fontSize: 11 }}>
              <th style={{ padding: '6px 0' }}>Apólice</th><th>Parcela</th><th>Valor</th><th>Status</th>
            </tr></thead>
            <tbody>
              {r.parcelas.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '6px 0' }}>{p.apolice} · {p.seguradora}</td>
                  <td>{p.numero_parcela}ª</td>
                  <td>{fmtBRL(p.valor)}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {r.vales?.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Vales</h3>
          <table style={{ width: '100%', fontSize: 13, marginBottom: 24, borderCollapse: 'collapse' }}>
            <tbody>
              {r.vales.map((v, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '6px 0' }}>{fmtDate(v.data)}</td>
                  <td>{fmtBRL(v.valor)}</td>
                  <td>{v.forma}</td>
                  <td>{v.descontado ? 'Descontado' : 'Pendente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {r.debitos?.length > 0 && (
        <>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Débitos</h3>
          <table style={{ width: '100%', fontSize: 13, marginBottom: 24, borderCollapse: 'collapse' }}>
            <tbody>
              {r.debitos.map((d, i) => (
                <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '6px 0' }}>{fmtDate(d.data)}</td>
                  <td>{fmtBRL(d.valor)}</td>
                  <td>{d.motivo || '—'}</td>
                  <td>{d.quitado ? 'Quitado' : 'Pendente'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ borderTop: '1px solid #eee', paddingTop: 24, marginTop: 24 }}>
        {registro.status === 'Aceito' ? (
          <div style={{ background: '#EAF3DE', border: '1px solid #C0DD97', borderRadius: 6, padding: 16, fontSize: 13.5 }}>
            ✓ Ciência confirmada por <b>{registro.nome_confirmado}</b> em {new Date(registro.data_aceite).toLocaleString('pt-BR')}.
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13.5, marginBottom: 12 }}>
              Declaro estar ciente e de acordo com os valores de comissão, vales e débitos apresentados acima.
            </p>
            <input
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{ width: '100%', padding: '11px 13px', border: '1px solid #ddd', borderRadius: 4, marginBottom: 12, fontSize: 14 }}
            />
            <button
              onClick={confirmarAceite}
              disabled={enviando}
              style={{ background: '#B08D57', color: '#fff', border: 'none', borderRadius: 4, padding: '12px 22px', fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}
            >
              {enviando ? 'Enviando...' : 'Aceito e confirmo os valores'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
