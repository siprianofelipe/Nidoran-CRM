'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState } from '../../../components/UI';

const ORIGENS = ['Indicação', 'Site', 'Redes sociais', 'Telefone', 'Outro'];
const STATUSES = ['Lead', 'Ativo', 'Inativo'];

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(null); // null | {} | cliente

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from('clientes').select('*').order('nome');
    setClientes(data || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(form) {
    if (!form.nome) { alert('Informe o nome do cliente.'); return; }
    if (form.id) {
      const { error } = await supabase.from('clientes').update(form).eq('id', form.id);
      if (error) return alert('Erro ao salvar: ' + error.message);
    } else {
      const { error } = await supabase.from('clientes').insert([{ ...form, data_cadastro: new Date().toISOString().slice(0, 10) }]);
      if (error) return alert('Erro ao salvar: ' + error.message);
    }
    setModal(null);
    carregar();
  }
  async function excluir(id) {
    if (!confirm('Excluir este cliente? As apólices vinculadas continuarão existindo.')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return alert('Erro ao excluir: ' + error.message);
    carregar();
  }

  const lista = clientes.filter(
    (c) => c.nome?.toLowerCase().includes(busca.toLowerCase()) || c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <Topbar
        title="Clientes"
        sub="Cadastro e histórico de clientes"
        action={<button className="btn btn-primary btn-sm" onClick={() => setModal({})}>+ Novo cliente</button>}
      />
      <div className="content">
        <div className="toolbar">
          <input type="text" placeholder="Buscar por nome ou e-mail..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="card">
          {carregando ? (
            <Loading />
          ) : !lista.length ? (
            <EmptyState text="Nenhum cliente encontrado." />
          ) : (
            <table>
              <thead>
                <tr><th>Nome</th><th>Contato</th><th>Cidade</th><th>Origem</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.nome}</b><div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{c.cpf}</div></td>
                    <td>{c.telefone}<div style={{ fontSize: 11.5, color: 'var(--slate)' }}>{c.email}</div></td>
                    <td>{c.cidade}</td>
                    <td>{c.origem}</td>
                    <td><span className={`pill ${c.status?.toLowerCase()}`}>{c.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setModal(c)}>✎</button>
                        <button className="icon-btn" onClick={() => excluir(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal !== null && <ClienteModal cliente={modal} onClose={() => setModal(null)} onSave={salvar} />}
    </>
  );
}

function ClienteModal({ cliente, onClose, onSave }) {
  const [form, setForm] = useState({
    id: cliente.id,
    nome: cliente.nome || '',
    cpf: cliente.cpf || '',
    telefone: cliente.telefone || '',
    email: cliente.email || '',
    cidade: cliente.cidade || '',
    origem: cliente.origem || ORIGENS[0],
    status: cliente.status || 'Lead',
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{cliente.id ? 'Editar cliente' : 'Novo cliente'}</h3>
        <div className="grid2">
          <div className="field" style={{ gridColumn: '1/-1' }}><label>Nome completo</label><input value={form.nome} onChange={set('nome')} /></div>
          <div className="field"><label>CPF</label><input value={form.cpf} onChange={set('cpf')} /></div>
          <div className="field"><label>Telefone</label><input value={form.telefone} onChange={set('telefone')} /></div>
          <div className="field" style={{ gridColumn: '1/-1' }}><label>E-mail</label><input value={form.email} onChange={set('email')} /></div>
          <div className="field"><label>Cidade/UF</label><input value={form.cidade} onChange={set('cidade')} /></div>
          <div className="field"><label>Origem do lead</label>
            <select value={form.origem} onChange={set('origem')}>
              {ORIGENS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
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
