'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, fmtBRL } from '../../../components/UI';

const ETAPAS = ['Novo lead', 'Em contato', 'Proposta enviada', 'Fechado', 'Perdido'];
const TIPOS = ['Vida', 'Consórcio', 'Previdência', 'Auto', 'Saúde];

export default function PipelinePage() {
  const [negocios, setNegocios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);

  async function carregar() {
    setCarregando(true);
    const [{ data: n }, { data: c }] = await Promise.all([
      supabase.from('negocios').select('*'),
      supabase.from('clientes').select('*').order('nome'),
    ]);
    setNegocios(n || []);
    setClientes(c || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const nomeCliente = (id) => clientes.find((c) => c.id === id)?.nome || '—';

  async function avancar(n) {
    const idx = ETAPAS.indexOf(n.etapa);
    if (idx < ETAPAS.length - 2) {
      await supabase.from('negocios').update({ etapa: ETAPAS[idx + 1] }).eq('id', n.id);
      carregar();
    }
  }
  async function excluir(id) {
    if (!confirm('Excluir este negócio do pipeline?')) return;
    await supabase.from('negocios').delete().eq('id', id);
    carregar();
  }
  async function novo(form) {
    const { error } = await supabase.from('negocios').insert([{
      cliente_id: form.cliente_id, produto_interesse: form.produto_interesse,
      valor_estimado: parseFloat(form.valor_estimado) || 0, etapa: 'Novo lead',
      criado_em: new Date().toISOString().slice(0, 10),
    }]);
    if (error) return alert('Erro: ' + error.message);
    setModal(false);
    carregar();
  }

  return (
    <>
      <Topbar title="Pipeline de vendas" sub="Leads em negociação, por etapa" action={
        <button className="btn btn-primary btn-sm" onClick={() => {
          if (!clientes.length) { alert('Cadastre ao menos um cliente antes de abrir um negócio.'); return; }
          setModal(true);
        }}>+ Novo negócio</button>
      } />
      <div className="content">
        {carregando ? <Loading /> : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ETAPAS.length},1fr)`, gap: 14 }}>
            {ETAPAS.map((etapa) => {
              const items = negocios.filter((n) => n.etapa === etapa);
              return (
                <div key={etapa}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--slate)', marginBottom: 10 }}>
                    {etapa} <span style={{ color: 'var(--brass)' }}>{items.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.length ? items.map((n) => (
                      <div className="card" style={{ padding: '13px 14px' }} key={n.id}>
                        <b style={{ fontSize: 13, display: 'block' }}>{nomeCliente(n.cliente_id)}</b>
                        <span style={{ fontSize: 12, color: 'var(--slate)' }}>{n.produto_interesse} · {fmtBRL(n.valor_estimado)}</span>
                        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {etapa !== 'Fechado' && etapa !== 'Perdido' && (
                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => avancar(n)}>Avançar →</button>
                          )}
                          <button className="icon-btn" onClick={() => excluir(n.id)}>🗑</button>
                        </div>
                      </div>
                    )) : <div style={{ fontSize: 12, color: 'var(--slate)', padding: '10px 0' }}>vazio</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal && <NegocioModal clientes={clientes} onClose={() => setModal(false)} onSave={novo} />}
    </>
  );
}

function NegocioModal({ clientes, onClose, onSave }) {
  const [form, setForm] = useState({ cliente_id: clientes[0]?.id || '', produto_interesse: TIPOS[0], valor_estimado: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Novo negócio no pipeline</h3>
        <div className="field"><label>Cliente / lead</label>
          <select value={form.cliente_id} onChange={set('cliente_id')}>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        </div>
        <div className="grid2">
          <div className="field"><label>Produto de interesse</label>
            <select value={form.produto_interesse} onChange={set('produto_interesse')}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field"><label>Valor estimado do prêmio (R$)</label><input type="number" step="0.01" value={form.valor_estimado} onChange={set('valor_estimado')} /></div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
