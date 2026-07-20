'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Topbar, Loading, EmptyState, fmtDate } from '../../../components/UI';

const TIPOS = ['Vida', 'Consórcio', 'Previdência', 'Auto'];

export default function MarketingPage() {
  const [campanhas, setCampanhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [segmento, setSegmento] = useState('todos');
  const [mensagem, setMensagem] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from('campanhas').select('*').order('data', { ascending: false });
    setCampanhas(data || []);
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!titulo.trim() || !mensagem.trim()) { alert('Preencha o título e a mensagem.'); return; }
    const { error } = await supabase.from('campanhas').insert([{
      titulo: titulo.trim(), mensagem: mensagem.trim(), segmento, data: new Date().toISOString().slice(0, 10),
    }]);
    if (error) return alert('Erro: ' + error.message);
    setTitulo(''); setMensagem('');
    carregar();
  }

  return (
    <>
      <Topbar title="Marketing" sub="Campanhas de e-mail para clientes" />
      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
          <div className="card">
            <div style={{ padding: 20 }}>
              <div className="section-title">Nova campanha de e-mail</div>
              <div className="field"><label>Título interno</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Renovação de seguro auto — julho" /></div>
              <div className="field"><label>Segmento</label>
                <select value={segmento} onChange={(e) => setSegmento(e.target.value)}>
                  <option value="todos">Todos os clientes ativos</option>
                  {TIPOS.map((t) => <option key={t} value={t}>Clientes com seguro {t}</option>)}
                  <option value="leads">Leads em aberto</option>
                </select>
              </div>
              <div className="field"><label>Mensagem</label><textarea rows="6" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Escreva o conteúdo do e-mail..." /></div>
              <button className="btn btn-primary btn-sm" onClick={salvar}>Salvar campanha</button>
              <p style={{ marginTop: 10, fontSize: 12, color: 'var(--slate)' }}>
                Isso organiza e guarda suas campanhas. Para o envio de verdade, conecte esta lista a uma ferramenta como Brevo ou Mailchimp.
              </p>
            </div>
          </div>
          <div className="card">
            <div style={{ padding: '18px 20px 0' }}><div className="section-title">Campanhas salvas</div></div>
            {carregando ? <Loading /> : !campanhas.length ? <EmptyState text="Nenhuma campanha criada ainda." /> : (
              campanhas.map((c) => (
                <div key={c.id} style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <b style={{ fontSize: 14 }}>{c.titulo}</b>
                    <span className="pill lead">{c.segmento}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 8 }}>{fmtDate(c.data)}</div>
                  <div style={{ fontSize: 13, background: 'var(--paper)', padding: '10px 12px', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{c.mensagem}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
