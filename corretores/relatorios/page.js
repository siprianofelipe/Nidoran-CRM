'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState, fmtBRL, fmtDate } from '../../../components/UI';

export default function RelatoriosPage() {
  const [apolices, setApolices] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [corretorId, setCorretorId] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data: a } = await supabase
      .from('apolices')
      .select('*, clientes(nome), corretores(nome)')
      .order('data_inicio', { ascending: false });
    const { data: c } = await supabase.from('corretores').select('*').order('nome');
    setApolices(a || []);
    setCorretores(c || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const filtradas = apolices.filter((a) => {
    if (dataInicio && a.data_inicio < dataInicio) return false;
    if (dataFim && a.data_inicio > dataFim) return false;
    if (corretorId && a.corretor_id !== corretorId) return false;
    return true;
  });

  const totalPremios = filtradas.reduce((s, a) => s + (Number(a.premio) || 0), 0);
  const totalComissaoCorretora = filtradas.reduce((s, a) => s + (Number(a.premio) || 0) * (Number(a.comissao_pct) || 0) / 100, 0);
  const totalComissaoCorretor = filtradas.reduce((s, a) => s + (Number(a.premio) || 0) * (Number(a.comissao_corretor_pct) || 0) / 100, 0);

  return (
    <>
      <Topbar
        title="Relatório de vendas e comissões"
        sub="Filtre por período e corretor, depois imprima ou exporte em PDF"
        action={<button className="btn btn-primary btn-sm no-print" onClick={() => window.print()}>Imprimir / exportar PDF</button>}
      />
      <div className="content">
        <style>{`
          @media print {
            .no-print{ display:none !important; }
            .sidebar{ display:none !important; }
            .shell{ display:block !important; }
          }
        `}</style>

        <div className="card no-print" style={{ padding: 20, marginBottom: 20 }}>
          <div className="grid2">
            <div className="field"><label>De</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="field"><label>Até</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="field" style={{ gridColumn: '1/-1' }}><label>Corretor</label>
              <select value={corretorId} onChange={(e) => setCorretorId(e.target.value)}>
                <option value="">Todos</option>
                {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="kpi-card"><div className="label">Total em prêmios</div><div className="value">{fmtBRL(totalPremios)}</div></div>
          <div className="kpi-card"><div className="label">Comissão da corretora</div><div className="value">{fmtBRL(totalComissaoCorretora)}</div></div>
          <div className="kpi-card"><div className="label">Comissão dos corretores</div><div className="value">{fmtBRL(totalComissaoCorretor)}</div></div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          {carregando ? <Loading /> : !filtradas.length ? (
            <EmptyState text="Nenhuma apólice encontrada para esse filtro." />
          ) : (
            <table>
              <thead>
                <tr><th>Data</th><th>Cliente</th><th>Seguradora</th><th>Tipo</th><th>Prêmio</th><th>Comissão corretora</th><th>Corretor</th><th>Comissão corretor</th></tr>
              </thead>
              <tbody>
                {filtradas.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDate(a.data_inicio)}</td>
                    <td>{a.clientes?.nome || '—'}</td>
                    <td>{a.seguradora}</td>
                    <td>{a.tipo}</td>
                    <td>{fmtBRL(a.premio)}</td>
                    <td>{fmtBRL((Number(a.premio) || 0) * (Number(a.comissao_pct) || 0) / 100)}</td>
                    <td>{a.corretores?.nome || '—'}</td>
                    <td>{fmtBRL((Number(a.premio) || 0) * (Number(a.comissao_corretor_pct) || 0) / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
