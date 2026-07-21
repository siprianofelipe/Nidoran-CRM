'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState, fmtBRL, fmtDate } from '../../../../components/UI';

export default function FinanceiroCorretorPage() {
  const [corretores, setCorretores] = useState([]);
  const [corretorId, setCorretorId] = useState('');
  const [parcelas, setParcelas] = useState([]);
  const [vales, setVales] = useState([]);
  const [debitos, setDebitos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalVale, setModalVale] = useState(null);
  const [modalDebito, setModalDebito] = useState(null);

  async function carregarCorretores() {
    const { data } = await supabase.from('corretores').select('*').order('nome');
    setCorretores(data || []);
    if (data && data.length) setCorretorId((atual) => atual || data[0].id);
  }
  useEffect(() => { carregarCorretores(); }, []);

  async function carregarFinanceiro(id) {
    if (!id) return;
    setCarregando(true);
    const [{ data: p }, { data: v }, { data: d }] = await Promise.all([
      supabase.from('parcelas_comissao_corretor').select('*, apolices(numero, seguradora)').eq('corretor_id', id).order('data_prevista'),
      supabase.from('vales_corretor').select('*').eq('corretor_id', id).order('data', { ascending: false }),
      supabase.from('debitos_corretor').select('*').eq('corretor_id', id).order('data', { ascending: false }),
    ]);
    setParcelas(p || []);
    setVales(v || []);
    setDebitos(d || []);
    setCarregando(false);
  }
  useEffect(() => { if (corretorId) carregarFinanceiro(corretorId); }, [corretorId]);

  const totalComissaoPendente = parcelas.filter((p) => p.status !== 'Pago').reduce((s, p) => s + Number(p.valor || 0), 0);
  const totalComissaoPaga = parcelas.filter((p) => p.status === 'Pago').reduce((s, p) => s + Number(p.valor || 0), 0);
  const totalValesPendentes = vales.filter((v) => !v.descontado).reduce((s, v) => s + Number(v.valor || 0), 0);
  const totalDebitosPendentes = debitos.filter((d) => !d.quitado).reduce((s, d) => s + Number(d.valor || 0), 0);
  const saldoLiquido = totalComissaoPendente - totalValesPendentes - totalDebitosPendentes;

  async function marcarParcela(id, status) {
    const { error } = await supabase.from('parcelas_comissao_corretor')
      .update({ status, data_pagamento: status === 'Pago' ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    carregarFinanceiro(corretorId);
  }

  async function salvarVale(form) {
    const payload = {
      corretor_id: corretorId,
      valor: parseFloat(form.valor) || 0,
      forma_pagamento: form.forma_pagamento,
      data: form.data,
      observacao: form.observacao || null,
    };
    const { error } = form.id
      ? await supabase.from('vales_corretor').update(payload).eq('id', form.id)
      : await supabase.from('vales_corretor').insert([payload]);
    if (error) return alert('Erro: ' + error.message);
    setModalVale(null);
    carregarFinanceiro(corretorId);
  }
  async function alternarVale(v) {
    const { error } = await supabase.from('vales_corretor').update({ descontado: !v.descontado }).eq('id', v.id);
    if (error) return alert('Erro: ' + error.message);
    carregarFinanceiro(corretorId);
  }
  async function excluirVale(id) {
    if (!confirm('Excluir este vale?')) return;
    await supabase.from('vales_corretor').delete().eq('id', id);
    carregarFinanceiro(corretorId);
  }

  async function salvarDebito(form) {
    const payload = {
      corretor_id: corretorId,
      valor: parseFloat(form.valor) || 0,
      motivo: form.motivo || null,
      data: form.data,
      observacao: form.observacao || null,
    };
    const { error } = form.id
      ? await supabase.from('debitos_corretor').update(payload).eq('id', form.id)
      : await supabase.from('debitos_corretor').insert([payload]);
    if (error) return alert('Erro: ' + error.message);
    setModalDebito(null);
    carregarFinanceiro(corretorId);
  }
  async function alternarDebito(d) {
    const { error } = await supabase.from('debitos_corretor').update({ quitado: !d.quitado }).eq('id', d.id);
    if (error) return alert('Erro: ' + error.message);
    carregarFinanceiro(corretorId);
  }
  async function excluirDebito(id) {
    if (!confirm('Excluir este débito?')) return;
    await supabase.from('debitos_corretor').delete().eq('id', id);
    carregarFinanceiro(corretorId);
  }

  return (
    <>
      <Topbar title="Financeiro do corretor" sub="Comissão a receber, vales e débitos" />
      <div className="content">
        <div className="field" style={{ maxWidth: 320, marginBottom: 20 }}>
          <label>Corretor</label>
          <select value={corretorId} onChange={(e) => setCorretorId(e.target.value)}>
            {corretores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>

        {carregando ? <Loading /> : (
          <>
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              <div className="kpi-card"><div className="label">Comissão a receber</div><div className="value">{fmtBRL(totalComissaoPendente)}</div></div>
              <div className="kpi-card"><div className="label">Já pago</div><div className="value">{fmtBRL(totalComissaoPaga)}</div></div>
              <div className="kpi-card"><div className="label">Vales pendentes</div><div className="value delta warn">{fmtBRL(totalValesPendentes)}</div></div>
              <div className="kpi-card"><div className="label">Débitos pendentes</div><div className="value delta warn">{fmtBRL(totalDebitosPendentes)}</div></div>
            </div>

            <div className="card" style={{ margin: '20px 0', padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 600 }}>Saldo líquido a pagar</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, marginTop: 6 }}>{fmtBRL(saldoLiquido)}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>comissão a receber − vales pendentes − débitos pendentes</div>
            </div>

            <div className="section-title" style={{ fontSize: 15, marginTop: 24 }}>Parcelas de comissão</div>
            <div className="card" style={{ marginBottom: 24 }}>
              {!parcelas.length ? <EmptyState text="Nenhuma parcela de comissão cadastrada para esse corretor." /> : (
                <table>
                  <thead><tr><th>Apólice</th><th>Parcela</th><th>Valor</th><th>Prevista para</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {parcelas.map((p) => (
                      <tr key={p.id}>
                        <td>{p.apolices?.numero || '—'}<div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{p.apolices?.seguradora}</div></td>
                        <td>{p.numero_parcela}ª de {parcelas.filter((x) => x.apolice_id === p.apolice_id).length}</td>
                        <td>{fmtBRL(p.valor)}</td>
                        <td>{fmtDate(p.data_prevista)}</td>
                        <td><span className={`pill ${p.status === 'Pago' ? 'ativo' : 'lead'}`}>{p.status}</span></td>
                        <td><div className="row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => marcarParcela(p.id, p.status === 'Pago' ? 'Pendente' : 'Pago')}>
                            {p.status === 'Pago' ? 'Marcar pendente' : 'Marcar pago'}
                          </button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 }}>
              <div className="section-title" style={{ fontSize: 15, marginBottom: 0 }}>Vales (adiantamentos)</div>
              <button className="btn btn-primary btn-sm" onClick={() => setModalVale({})}>+ Novo vale</button>
            </div>
            <div className="card" style={{ margin: '14px 0 24px' }}>
              {!vales.length ? <EmptyState text="Nenhum vale registrado." /> : (
                <table>
                  <thead><tr><th>Data</th><th>Valor</th><th>Forma</th><th>Obs.</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {vales.map((v) => (
                      <tr key={v.id}>
                        <td>{fmtDate(v.data)}</td>
                        <td>{fmtBRL(v.valor)}</td>
                        <td>{v.forma_pagamento}</td>
                        <td>{v.observacao || '—'}</td>
                        <td><span className={`pill ${v.descontado ? 'ativo' : 'lead'}`}>{v.descontado ? 'Descontado' : 'Pendente'}</span></td>
                        <td><div className="row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => alternarVale(v)}>{v.descontado ? 'Reabrir' : 'Descontar'}</button>
                          <button className="icon-btn" onClick={() => excluirVale(v.id)}>🗑</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 }}>
              <div className="section-title" style={{ fontSize: 15, marginBottom: 0 }}>Débitos</div>
              <button className="btn btn-primary btn-sm" onClick={() => setModalDebito({})}>+ Novo débito</button>
            </div>
            <div className="card" style={{ margin: '14px 0' }}>
              {!debitos.length ? <EmptyState text="Nenhum débito registrado." /> : (
                <table>
                  <thead><tr><th>Data</th><th>Valor</th><th>Motivo</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {debitos.map((d) => (
                      <tr key={d.id}>
                        <td>{fmtDate(d.data)}</td>
                        <td>{fmtBRL(d.valor)}</td>
                        <td>{d.motivo || '—'}</td>
                        <td><span className={`pill ${d.quitado ? 'ativo' : 'lead'}`}>{d.quitado ? 'Quitado' : 'Pendente'}</span></td>
                        <td><div className="row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => alternarDebito(d)}>{d.quitado ? 'Reabrir' : 'Quitar'}</button>
                          <button className="icon-btn" onClick={() => excluirDebito(d.id)}>🗑</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {modalVale && <ModalVale vale={modalVale} onClose={() => setModalVale(null)} onSave={salvarVale} />}
      {modalDebito && <ModalDebito debito={modalDebito} onClose={() => setModalDebito(null)} onSave={salvarDebito} />}
    </>
  );
}

function ModalVale({ vale, onClose, onSave }) {
  const [form, setForm] = useState({
    id: vale.id,
    valor: vale.valor || '',
    forma_pagamento: vale.forma_pagamento || 'Dinheiro',
    data: vale.data || new Date().toISOString().slice(0, 10),
    observacao: vale.observacao || '',
  });
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{vale.id ? 'Editar vale' : 'Novo vale'}</h3>
        <div className="grid2">
          <div className="field"><label>Valor</label><input type="number" step="0.01" value={form.valor} onChange={set('valor')} /></div>
          <div className="field"><label>Forma</label>
            <select value={form.forma_pagamento} onChange={set('forma_pagamento')}>
              <option>Dinheiro</option>
              <option>Cheque</option>
            </select>
          </div>
          <div className="field"><label>Data</label><input type="date" value={form.data} onChange={set('data')} /></div>
          <div className="field" style={{ gridColumn: '1/-1' }}><label>Observação</label><input value={form.observacao} onChange={set('observacao')} /></div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ModalDebito({ debito, onClose, onSave }) {
  const [form, setForm] = useState({
    id: debito.id,
    valor: debito.valor || '',
    motivo: debito.motivo || '',
    data: debito.data || new Date().toISOString().slice(0, 10),
    observacao: debito.observacao || '',
  });
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{debito.id ? 'Editar débito' : 'Novo débito'}</h3>
        <div className="grid2">
          <div className="field"><label>Valor</label><input type="number" step="0.01" value={form.valor} onChange={set('valor')} /></div>
          <div className="field"><label>Data</label><input type="date" value={form.data} onChange={set('data')} /></div>
          <div className="field" style={{ gridColumn: '1/-1' }}><label>Motivo</label><input value={form.motivo} onChange={set('motivo')} placeholder="Ex: apólice cancelada, erro de pagamento" /></div>
          <div className="field" style={{ gridColumn: '1/-1' }}><label>Observação</label><input value={form.observacao} onChange={set('observacao')} /></div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
