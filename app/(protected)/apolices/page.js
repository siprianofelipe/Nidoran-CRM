'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState, fmtBRL, fmtDate, diasPara } from '../../../components/UI';

const TIPOS = ['Vida', 'Consórcio', 'Previdência', 'Auto', 'Saúde'];
const PERIODICIDADES = ['Mensal', 'Anual', 'Única'];
const STATUSES = ['Ativa', 'Em Análise', 'Cancelada', 'Vencida'];

export default function ApolicesPage() {
  const [apolices, setApolices] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [comissoes, setComissoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(null);

  async function carregar() {
    setCarregando(true);
    const [{ data: a }, { data: c }, { data: com }] = await Promise.all([
      supabase.from('apolices').select('*').order('data_vencimento'),
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('tabela_comissoes').select('*'),
    ]);
    setApolices(a || []);
    setClientes(c || []);
    setComissoes(com || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  const nomeCliente = (id) => clientes.find((c) => c.id === id)?.nome || '—';

  async function salvar(form) {
    if (!form.data_vencimento) { alert('Informe a data de vencimento.'); return; }
    const payload = { ...form, premio: parseFloat(form.premio) || 0, comissao_pct: parseFloat(form.comissao_pct) || 0 };
    if (form.id) {
      const { error } = await supabase.from('apolices').update(payload).eq('id', form.id);
      if (error) return alert('Erro: ' + error.message);
    } else {
      delete payload.id;
      const { error } = await supabase.from('apolices').insert([payload]);
      if (error) return alert('Erro: ' + error.message);
    }
    setModal(null);
    carregar();
  }
  async function excluir(id) {
    if (!confirm('Excluir esta apólice?')) return;
    const { error } = await supabase.from('apolices').delete().eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    carregar();
  }

  let lista = apolices.filter((a) => !filtroTipo || a.tipo === filtroTipo);
  lista = lista.filter((a) => nomeCliente(a.cliente_id).toLowerCase().includes(busca.toLowerCase()) || a.seguradora?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <>
      <Topbar
        title="Apólices"
        sub="Vida, consórcio, previdência e auto"
        action={<button className="btn btn-primary btn-sm" onClick={() => {
          if (!clientes.length) { alert('Cadastre ao menos um cliente antes de criar uma apólice.'); return; }
          setModal({});
        }}>+ Nova apólice</button>}
      />
      <div className="content">
        <div className="toolbar">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ maxWidth: 200, padding: '10px 13px', border: '1px solid var(--line)', borderRadius: 4 }}>
            <option value="">Todos os tipos</option>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Buscar por cliente ou seguradora..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="card">
          {carregando ? <Loading /> : !lista.length ? <EmptyState text="Nenhuma apólice encontrada." /> : (
            <table>
              <thead><tr><th>Cliente</th><th>Produto</th><th>Seguradora</th><th>Prêmio</th><th>Comissão</th><th>Vencimento</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {lista.map((a) => {
                  const dias = diasPara(a.data_vencimento);
                  return (
                    <tr key={a.id}>
                      <td><b>{nomeCliente(a.cliente_id)}</b></td>
                      <td>{a.tipo}</td>
                      <td>{a.seguradora}<div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{a.numero}</div></td>
                      <td>{fmtBRL(a.premio)}<div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{a.periodicidade}</div></td>
                      <td>{fmtBRL((a.premio || 0) * (a.comissao_pct || 0) / 100)}<div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{a.comissao_pct}%</div></td>
                      <td>{fmtDate(a.data_vencimento)}<div style={{ fontSize: 11.5, color: dias <= 7 ? 'var(--rust)' : dias <= 30 ? 'var(--amber)' : 'var(--slate)' }}>{dias >= 0 ? dias + ' dias' : 'vencida'}</div></td>
                      <td><span className={`pill ${a.status?.toLowerCase()}`}>{a.status}</span></td>
                      <td><div className="row-actions">
                        <button className="icon-btn" onClick={() => setModal(a)}>✎</button>
                        <button className="icon-btn" onClick={() => excluir(a.id)}>🗑</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal !== null && (
        <ApoliceModal apolice={modal} clientes={clientes} comissoes={comissoes} onClose={() => setModal(null)} onSave={salvar} />
      )}
    </>
  );
}

function ApoliceModal({ apolice, clientes, comissoes, onClose, onSave }) {
  const [form, setForm] = useState({
    id: apolice.id,
    cliente_id: apolice.cliente_id || clientes[0]?.id || '',
    tipo: apolice.tipo || TIPOS[0],
    seguradora: apolice.seguradora || '',
    numero: apolice.numero || '',
    periodicidade: apolice.periodicidade || 'Mensal',
    premio: apolice.premio || '',
    comissao_pct: apolice.comissao_pct || '',
    data_inicio: apolice.data_inicio || '',
    data_vencimento: apolice.data_vencimento || '',
    status: apolice.status || 'Ativa',
  });
  const [hint, setHint] = useState('Preenche sozinho ao escolher tipo + seguradora, se houver regra cadastrada.');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function aplicarComissao(seguradora, tipo) {
    if (!seguradora || !tipo) return;
    const regra = comissoes.find((c) => c.seguradora.trim().toLowerCase() === seguradora.trim().toLowerCase() && c.tipo === tipo);
    if (regra) {
      setForm((f) => ({ ...f, comissao_pct: regra.percentual }));
      setHint(`Preenchido automaticamente pela tabela de comissionamento (${seguradora} · ${tipo}).`);
    } else {
      setHint(`Sem regra cadastrada para ${seguradora} · ${tipo} — informe o % manualmente ou cadastre em Comissionamento.`);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{apolice.id ? 'Editar apólice' : 'Nova apólice'}</h3>
        <div className="field"><label>Cliente</label>
          <select value={form.cliente_id} onChange={set('cliente_id')}>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div className="grid2">
          <div className="field"><label>Tipo de seguro</label>
            <select value={form.tipo} onChange={(e) => { set('tipo')(e); aplicarComissao(form.seguradora, e.target.value); }}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field"><label>Seguradora</label>
            <input value={form.seguradora} onChange={set('seguradora')} onBlur={(e) => aplicarComissao(e.target.value, form.tipo)} />
          </div>
          <div className="field"><label>Nº da apólice</label><input value={form.numero} onChange={set('numero')} /></div>
          <div className="field"><label>Periodicidade</label>
            <select value={form.periodicidade} onChange={set('periodicidade')}>
              {PERIODICIDADES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field"><label>Valor do prêmio (R$)</label><input type="number" step="0.01" value={form.premio} onChange={set('premio')} /></div>
          <div className="field">
            <label>% Comissão</label>
            <input type="number" step="0.1" value={form.comissao_pct} onChange={set('comissao_pct')} />
            <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 5 }}>{hint}</div>
          </div>
          <div className="field"><label>Data de início</label><input type="date" value={form.data_inicio} onChange={set('data_inicio')} /></div>
          <div className="field"><label>Data de vencimento</label><input type="date" value={form.data_vencimento} onChange={set('data_vencimento')} /></div>
          <div className="field" style={{ gridColumn: '1/-1' }}><label>Status</label>
            <select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
