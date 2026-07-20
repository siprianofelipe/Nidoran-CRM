'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, fmtBRL } from '../../../components/UI';

const TIPOS = ['Vida', 'Consórcio', 'Previdência', 'Auto'];

export default function FinanceiroPage() {
  const [apolices, setApolices] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('apolices').select('*');
      setApolices(data || []);
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <><Topbar title="Financeiro" sub="Comissões e receita da carteira" /><div className="content"><Loading /></div></>;

  const ativas = apolices.filter((a) => a.status === 'Ativa');
  const porTipo = TIPOS.map((t) => {
    const list = ativas.filter((a) => a.tipo === t);
    const receita = list.reduce((s, a) => s + (a.premio || 0), 0);
    const comissao = list.reduce((s, a) => s + (a.premio || 0) * (a.comissao_pct || 0) / 100, 0);
    return { t, n: list.length, receita, comissao };
  });
  const totalReceita = porTipo.reduce((s, x) => s + x.receita, 0);
  const totalComissao = porTipo.reduce((s, x) => s + x.comissao, 0);

  return (
    <>
      <Topbar title="Financeiro" sub="Comissões e receita da carteira" />
      <div className="content">
        <div className="kpi-grid">
          <div className="kpi-card"><div className="label">Prêmios ativos (mensal)</div><div className="value">{fmtBRL(totalReceita)}</div></div>
          <div className="kpi-card"><div className="label">Comissão total estimada</div><div className="value">{fmtBRL(totalComissao)}</div></div>
          <div className="kpi-card"><div className="label">Ticket médio de comissão</div><div className="value">{fmtBRL(ativas.length ? totalComissao / ativas.length : 0)}</div></div>
          <div className="kpi-card"><div className="label">Apólices ativas</div><div className="value">{ativas.length}</div></div>
        </div>
        <div className="card">
          <table>
            <thead><tr><th>Produto</th><th>Apólices</th><th>Receita de prêmios</th><th>Comissão estimada</th></tr></thead>
            <tbody>
              {porTipo.map((x) => (
                <tr key={x.t}><td><b>{x.t}</b></td><td>{x.n}</td><td>{fmtBRL(x.receita)}</td><td>{fmtBRL(x.comissao)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 14, fontSize: 12, color: 'var(--slate)' }}>
          Valores estimados a partir dos prêmios e percentuais de comissão das apólices ativas. Não substitui o fechamento financeiro oficial.
        </p>
      </div>
    </>
  );
}
