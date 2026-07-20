'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, fmtBRL, fmtDate, diasPara } from '../../../components/UI';

export default function IAPage() {
  const [apolices, setApolices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState('');
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from('apolices').select('*'),
        supabase.from('clientes').select('*'),
      ]);
      setApolices(a || []);
      setClientes(c || []);
      setCarregando(false);
    })();
  }, []);

  const nomeCliente = (id) => clientes.find((c) => c.id === id) || null;

  async function gerar() {
    if (!selecionada) { alert('Selecione uma apólice.'); return; }
    const a = apolices.find((x) => x.id === selecionada);
    const c = nomeCliente(a.cliente_id);
    const dias = diasPara(a.data_vencimento);
    setGerando(true);
    setResultado('');

    const prompt = `Você é um assistente de uma corretora de seguros no Brasil. Gere uma sugestão curta e prática (máximo 120 palavras, em português) de como o corretor deve abordar este cliente para renovar a apólice ou oferecer produtos complementares.

Cliente: ${c?.nome}, status ${c?.status}, cidade ${c?.cidade}.
Apólice: ${a.tipo}, seguradora ${a.seguradora}, prêmio ${fmtBRL(a.premio)} (${a.periodicidade}), vence em ${dias} dias.

Dê 1) uma linha de abertura de conversa e 2) uma sugestão concreta de produto complementar entre Vida, Consórcio, Previdência ou Auto (o que ainda não tiver), com o motivo. Seja direto e objetivo.`;

    try {
      const resp = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await resp.json();
      setResultado(data.text || data.error || 'Não foi possível gerar a sugestão agora.');
    } catch (e) {
      setResultado('Não foi possível conectar ao assistente agora. Tente novamente em instantes.');
    }
    setGerando(false);
  }

  if (carregando) return <><Topbar title="Assistente IA" sub="Apoio à tomada de decisão" /><div className="content"><Loading /></div></>;

  return (
    <>
      <Topbar title="Assistente IA" sub="Apoio à tomada de decisão" />
      <div className="content">
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title">Sugestão de abordagem para renovação</div>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 16 }}>
            Escolha uma apólice e a IA sugere como o corretor deve abordar o cliente para renovar ou fazer upsell.
          </p>
          <select value={selecionada} onChange={(e) => setSelecionada(e.target.value)}>
            <option value="">Selecione uma apólice...</option>
            {apolices.map((a) => (
              <option key={a.id} value={a.id}>
                {nomeCliente(a.cliente_id)?.nome} — {a.tipo} ({a.seguradora}, vence {fmtDate(a.data_vencimento)})
              </option>
            ))}
          </select>
          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={gerar} disabled={gerando}>
              {gerando ? 'Gerando...' : 'Gerar sugestão'}
            </button>
          </div>
          {resultado && (
            <div style={{ marginTop: 16, padding: '16px 18px', background: 'var(--paper)', borderLeft: '3px solid var(--brass)', borderRadius: '0 4px 4px 0', fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {resultado}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
