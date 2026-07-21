'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState } from '../../../components/UI';

export default function CorretoresPage() {
  const [corretores, setCorretores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from('corretores').select('*').order('nome');
    setCorretores(data || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(form) {
    if (!form.nome) { alert('Informe o nome do corretor.'); return; }
    const payload = {
      nome: form.nome,
      cpf_cnpj: form.cpf_cnpj || null,
      email: form.email || null,
      telefone: form.telefone || null,
      percentual_padrao: parseFloat(form.percentual_padrao) || 0,
      ativo: form.ativo !== false,
    };
    if (form.id) {
      const { error } = await supabase.from('corretores').update(payload).eq('id', form.id);
      if (error) return alert('Erro: ' + error.message);
    } else {
      const { error } = await supabase.from('corretores').insert([payload]);
      if (error) return alert('Erro: ' + error.message);
    }
    setModal(null);
    carregar();
  }

  async function excluir(id) {
    if (!confirm('Excluir este corretor? Apólices já vinculadas a ele não serão apagadas.')) return;
    const { error } = await supabase.from('corretores').delete().eq('id', id);
    if (error) return alert('Erro: ' + error.message);
    carregar();
  }

  return (
    <>
      <Topbar
        title="Corretores"
        sub="Cadastro dos corretores e % de comissão padrão"
        action={<button className="btn btn-primary btn-sm" onClick={() => setModal({})}>+ Novo corretor</button>}
      />
      <div className="content">
        <div className="card">
          {carregando ? <Loading /> : !corretores.length ? (
            <EmptyState text="Nenhum corretor cadastrado ainda." />
          ) : (
            <table>
              <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Contato</th><th>% padrão</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {corretores.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.nome}</b></td>
                    <td>{c.cpf_cnpj || '—'}</td>
                    <td>{c.email || c.telefone || '—'}</td>
                    <td>{c.percentual_padrao}%</td>
                    <td><span className={`pill ${c.ativo ? 'ativo' : 'inativo'}`}>{c.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td><div className="row-actions">
                      <button className="icon-btn" onClick={() => setModal(c)}>✎</button>
                      <button className="icon-btn" onClick={() => excluir(c.id)}>🗑</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal && <ModalCorretor corretor={modal} onClose={() => setModal(null)} onSave={salvar} />}
    </>
  );
}

function ModalCorretor({ corretor, onClose, onSave }) {
  const [form, setForm] = useState({
    id: corretor.id,
    nome: corretor.nome || '',
    cpf_cnpj: corretor.cpf_cnpj || '',
    email: corretor.email || '',
    telefone: corretor.telefone || '',
    percentual_padrao: corretor.percentual_padrao ?? 0,
    ativo: corretor.ativo ?? true,
  });
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{corretor.id ? 'Editar corretor' : 'Novo corretor'}</h3>
        <div className="field"><label>Nome</label>
          <input value={form.nome} onChange={set('nome')} />
        </div>
        <div className="grid2">
          <div className="field"><label>CPF/CNPJ</label>
            <input value={form.cpf_cnpj} onChange={set('cpf_cnpj')} />
          </div>
          <div className="field"><label>% comissão padrão</label>
            <input type="number" step="0.1" value={form.percentual_padrao} onChange={set('percentual_padrao')} />
          </div>
          <div className="field"><label>Email</label>
            <input value={form.email} onChange={set('email')} />
          </div>
          <div className="field"><label>Telefone</label>
            <input value={form.telefone} onChange={set('telefone')} />
          </div>
          <div className="field" style={{ gridColumn: '1/-1' }}><label>Status</label>
            <select value={form.ativo ? 'true' : 'false'} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'true' })}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
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
