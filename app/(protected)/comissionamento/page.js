'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState } from '../../../components/UI';

const TIPOS = ['Vida', 'Consórcio', 'Previdência', 'Auto', 'Saúde'];

export default function ComissionamentoPage() {
  const [regras, setRegras] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from('tabela_comissoes').select('*').order('seguradora');
    setRegras(data || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(form) {
    if (!form.seguradora) { alert('Informe a seguradora.'); return; }
    const payload = { seguradora: form.seguradora, tipo: form.tipo, percentual: parseFloat(form.percentual) || 0 };
    if (form.id) {
      const { error } = await supabase.from('tabela_comissoes').update(payload).eq('id', form.id);
      if (error) return alert('Erro: ' + error.message);
    } else {
      const { error } = await supabase.from('tabela_comissoes').insert([payload]);
      if (error) return alert('Erro: ' + error.message);
    }
    setModal(null);
    carregar();
  }
  async function excluir(id) {
    if (!confirm('Excluir esta regra de comissionamento?')) return;
    const { error } = await supabase.from('tabela_comissoes').delete().eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    carregar();
  }

  return (
    <>
      <Topbar
        title="Tabela de comissionamento"
        sub="% de comissão por seguradora e produto"
        action={<button className="btn btn-primary btn-sm" onClick={() => setModal({})}>+ Nova regra</button>}
      />
      <div className="content">
        <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 16, maxWidth: 640 }}>
          Cadastre aqui o % que cada seguradora paga por produto. Ao criar uma apólice, o sistema
          preenche a comissão sozinha com base nesta tabela — você só ajusta se aquele contrato específico for diferente.
        </p>
        <div className="card">
          {carregando ? <Loading /> : !regras.length ? <EmptyState text="Nenhuma regra cadastrada." /> : (
            <table>
              <thead><tr><th>Seguradora</th><th>Produto</th><th>% Comissão</th><th></th></tr></thead>
              <tbody>
                {regras.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.seguradora}</b></td>
                    <td>{r.tipo}</td>
                    <td><span className="pill ativo">{r.percentual}%</span></td>
                    <td><div className="row-actions">
                      <button className="icon-btn" onClick={() => setModal(r)}>✎</button>
                      <button className="icon-btn" onClick={() => excluir(r.id)}>🗑</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal !== null && <RegraModal regra={modal} onClose={() => setModal(null)} onSave={salvar} />}
    </>
  );
}

function RegraModal({ regra, onClose, onSave }) {
  const [form, setForm] = useState({
    id: regra.id,
    seguradora: regra.seguradora || '',
    tipo: regra.tipo || TIPOS[0],
    percentual: regra.percentual ?? '',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{regra.id ? 'Editar regra' : 'Nova regra de comissionamento'}</h3>
        <div className="field"><label>Seguradora</label><input value={form.seguradora} onChange={set('seguradora')} placeholder="Ex: Porto Seguro" /></div>
        <div className="grid2">
          <div className="field"><label>Produto</label>
            <select value={form.tipo} onChange={set('tipo')}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div className="field"><label>% de comissão</label><input type="number" step="0.1" value={form.percentual} onChange={set('percentual')} /></div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onSave(form)}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
