'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState, fmtBRL, fmtDate, diasPara } from '../../../components/UI';

function urgencyOf(dias) {
  if (dias <= 7) return { color: 'var(--rust)', bg: 'var(--rust-bg)', tag: 'Urgente' };
  if (dias <= 30) return { color: 'var(--amber)', bg: 'var(--amber-bg)', tag: 'Atenção' };
  return { color: 'var(--sage)', bg: 'var(--sage-bg)', tag: 'Tranquilo' };
}
const TIPOS = ['Vida', 'Consórcio', 'Previdência', 'Auto'];

export default function DashboardPage() {
  const [clientes, setClientes] = useState([]);
  const [apolices, setApolices] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('apolices').select('*'),
      ]);
      setClientes(c || []);
      setApolices(a || []);
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <Loading />;

  const ativas = apolices.filter((a) => a.status === 'Ativa');
  const comissaoMes = ativas.reduce((s, a) => s + (a.premio || 0) * ((a.comissao_pct || 0) / 100), 0);
  const leads = clientes.filter((c) => c.status === 'Lead').length;
  const proximos30 = ativas.filter((a) => diasPara(a.data_vencimento) <= 30).length;
  const radar = ativas
    .map((a) => ({ ...a, dias: diasPara(a.data_vencimento) }))
    .sort((x, y) => x.dias - y.dias)
    .slice(0, 6);
  const nomeCliente = (id) => clientes.find((c) => c.id === id)?.nome || '—';

  return (
    <>
      <Topbar title="Dashboard" sub="Visão geral da carteira" />
      <div className="content">
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="label">Apólices ativas</div>
            <div className="value">{ativas.length}</div>
            <div className="delta">{clientes.length} clientes na base</div>
          </div>
          <div className="kpi-card">
            <div className="label">Comissão do mês (est.)</div>
            <div className="value">{fmtBRL(comissaoMes)}</div>
            <div className="delta">soma das apólices ativas</div>
          </div>
          <div className="kpi-card">
            <div className="label">Renovações em 30 dias</div>
            <div className="value">{proximos30}</div>
            <div className={`delta ${proximos30 > 0 ? 'warn' : ''}`}>
              {proximos30 > 0 ? 'requer atenção' : 'nenhuma urgência'}
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">Leads em aberto</div>
            <div className="value">{leads}</div>
            <div className="delta">aguardando conversão</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ padding: '18px 20px 0' }}>
              <div className="section-title">Radar de prioridade</div>
            </div>
            {radar.length ? (
              radar.map((a) => {
                const u = urgencyOf(a.dias);
                return (
                  <div className="radar-item" key={a.id}>
                    <div className="radar-bar" style={{ background: u.color }} />
                    <div className="radar-days" style={{ color: u.color }}>{a.dias}</div>
                    <div className="radar-info">
                      <b>{nomeCliente(a.cliente_id)}</b>
                      <span>{a.tipo} · {a.seguradora} · vence {fmtDate(a.data_vencimento)}</span>
                    </div>
                    <div className="radar-tag" style={{ background: u.bg, color: u.color }}>{u.tag}</div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="Nenhuma apólice ativa cadastrada ainda." />
            )}
          </div>

          <div className="card">
            <div style={{ padding: 20 }}>
              <div className="section-title">Carteira por produto</div>
              {TIPOS.map((t) => {
                const n = ativas.filter((a) => a.tipo === t).length;
                const max = Math.max(1, ...TIPOS.map((tt) => ativas.filter((a) => a.tipo === tt).length));
                const pct = Math.round((n / max) * 100);
                return (
                  <div key={t} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                      <span>{t}</span>
                      <span style={{ color: 'var(--slate)' }}>{n}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--paper)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brass)', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
