export function Topbar({ title, sub, action }) {
  return (
    <div className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      <div>{action}</div>
    </div>
  );
}

export function Loading() {
  return <div style={{ padding: 40, color: 'var(--slate)' }}>Carregando...</div>;
}

export function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export function fmtBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
export function diasPara(iso) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(iso + 'T00:00:00');
  return Math.round((alvo - hoje) / 86400000);
}
export function escapeAttr(s) {
  return s || '';
}
