'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState, diasPara } from '../../../components/UI';

export default function TarefasPage() {
  const [apolices, setApolices] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [manuais, setManuais] = useState([]);
  const [autoConcluidas, setAutoConcluidas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(false);

  async function carregar() {
    setCarregando(true);
    const [{ data: a }, { data: n }, { data: c }, { data: m }, { data: ac }] = await Promise.all([
      supabase.from('apolices').select('*'),
      supabase.from('negocios').select('*'),
      supabase.from('clientes').select('*'),
      supabase.from('tarefas_manuais').select('*').eq('concluida', false),
      supabase.from('tarefas_auto_concluidas').select('*'),
    ]);
    setApolices(a || []);
    setNegocios(n || []);
    setClientes(c || []);
    setManuais(m || []);
    setAutoConcluidas((ac || []).map((x) => x.id));
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  if (carregando) return <><Topbar title="Tarefas do dia" sub="O que precisa da sua atenção hoje" /><div className="content"><Loading /></div></>;

  const nomeCliente = (id) => clientes.find((c) => c.id === id)?.nome || '—';
  const tarefasAuto = [];
  apolices.filter((a) => a.status === 'Ativa').forEach((a) => {
    const dias = diasPara(a.data_vencimento);
    if (dias <= 15) {
      tarefasAuto.push({
        id: 'renov-' + a.id,
        tipo: 'Renovação',
        titulo: `Ligar para ${nomeCliente(a.cliente_id)} sobre renovação (${a.tipo})`,
        urgente: dias <= 7,
        detalhe: dias >= 0 ? `vence em ${dias} dias — ${a.seguradora}` : `vencida há ${-dias} dias — ${a.seguradora}`,
      });
    }
  });
  negocios.filter((n) => n.etapa === 'Novo lead' || n.etapa === 'Em contato').forEach((n) => {
    tarefasAuto.push({
      id: 'neg-' + n.id,
      tipo: 'Pipeline',
      titulo: `Dar sequência em ${nomeCliente(n.cliente_id)} (${n.produto_interesse})`,
      urgente: n.etapa === 'Novo lead',
      detalhe: `etapa atual: ${n.etapa}`,
    });
  });
  const pendentesAuto = tarefasAuto.filter((t) => !autoConcluidas.includes(t.id));
  const todas = [...pendentesAuto, ...manuais.map((m) => ({ id: 'man-' + m.id, tipo: 'Manual', titulo: m.titulo, urgente: false, detalhe: 'adicionada manualmente', manualId: m.id }))];

  async function concluir(t) {
    if (t.manualId) {
      await supabase.from('tarefas_manuais').update({ concluida: true }).eq('id', t.manualId);
    } else {
      await supabase.from('tarefas_auto_concluidas').insert([{ id: t.id }]);
    }
    carregar();
  }
  async function novaTarefa(titulo) {
    const { error } = await supabase.from('tarefas_manuais').insert([{ titulo, concluida: false }]);
    if (error) return alert('Erro: ' + error.message);
    setModal(false);
    carregar();
  }

  return (
    <>
      <Topbar title="Tarefas do dia" sub="O que precisa da sua atenção hoje" action={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Tarefa manual</button>} />
      <div className="content">
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <div className="kpi-card"><div className="label">Pendentes hoje</div><div className="value">{todas.length}</div></div>
          <div className="kpi-card"><div className="label">Urgentes</div><div className="value" style={{ color: 'var(--rust)' }}>{todas.filter((t) => t.urgente).length}</div></div>
        </div>
        <div className="card">
          {!todas.length ? <EmptyState text="Nenhuma tarefa pendente. Tudo em dia por aqui." /> : todas.map((t) => (
            <div className="radar-item" key={t.id}>
              <div className="radar-bar" style={{ background: t.urgente ? 'var(--rust)' : 'var(--brass)' }} />
              <div className="radar-info" style={{ flex: 1 }}><b>{t.titulo}</b><span>{t.tipo} · {t.detalhe}</span></div>
              <button className="btn btn-ghost btn-sm" onClick={() => concluir(t)}>Concluir</button>
            </div>
          ))}
        </div>
      </div>
      {modal && <TarefaModal onClose={() => setModal(false)} onSave={novaTarefa} />}
    </>
  );
}

function TarefaModal({ onClose, onSave }) {
  const [titulo, setTitulo] = useState('');
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Nova tarefa manual</h3>
        <div className="field"><label>Descrição</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Enviar boleto para o cliente X" /></div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => titulo.trim() ? onSave(titulo.trim()) : alert('Descreva a tarefa.')}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
