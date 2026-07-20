import './globals.css';

export const metadata = {
  title: 'Nidoran Seguros — Painel',
  description: 'Sistema de gestão da Nidoran Corretora de Seguros',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
