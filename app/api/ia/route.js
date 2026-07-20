export async function POST(req) {
  const { prompt } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' }, { status: 500 });
  }
  if (!prompt) {
    return Response.json({ error: 'Prompt vazio.' }, { status: 400 });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await resp.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    return Response.json({ text: text || 'Não foi possível gerar a sugestão agora.' });
  } catch (e) {
    return Response.json({ error: 'Falha ao conectar com a Anthropic API.' }, { status: 500 });
  }
}
