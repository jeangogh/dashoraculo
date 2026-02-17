import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const ORACLE_DATA = `
## Dados do Oraculo Pessoal — Jean

### Bloqueios registrados
| Data | Contexto | Tipo | Resolucao | Tempo |
|------|----------|------|-----------|-------|
| 2026-02-16 ~12:40 | Instalar Hotjar no site redesign | Nao sabe usar GTM | Guia passo a passo (6 trocas) | ~15min |
| 2026-02-16 ~12:00 | Deploy falhando na Vercel | Nao sabia que env vars precisavam checkbox Production | Explicacao + acao direta | ~15min |
| 2026-02-16 ~11:30 | Dominio abrindo site errado | Nao sabia que dominio estava no projeto Vercel errado | Explicacao + mover dominio | ~10min |
| 2026-02-16 ~23:00 | Login quebrado pra todos usuarios | Supabase Site URL = localhost:3000 | Trocar Site URL + Redirect URLs + fix codigo | ~20min |

### Padroes de sessao
| Data | Inicio | Fim | Pedidas | Completas | Abandonos | Tema |
|------|--------|-----|---------|-----------|-----------|------|
| 2026-02-16 | ~11:00 | ~13:00 | 4 | 2 | 1 (Hotjar via codigo) | Deploy site redesign + Hotjar |
| 2026-02-16 | ~21:00 | ~22:30 | 6 | 5 | 0 | Commit + logo + desktop responsive + PRD Lazy Plan + codigo v1 |
| 2026-02-16 | ~23:30 | ~00:30 | 2 | 2 | 0 | Drag-drop + multimodal QuebraPassos |
| 2026-02-16 | sessao longa | em andamento | 8+ | 7+ | 0 | Organizar PC + TreeApp (dominio, UI, fix API key) |

### Padroes recorrentes
- Vercel/Deploy: Precisa de passo a passo. Nao familiarizado com branches, env vars, production vs preview.
- Conceitos tecnicos: Responde melhor a analogias (porteiro, casa, chave). Termos tecnicos causam confusao.
- Preferencia: Quer que o assistente faca, nao que explique. Quando precisa fazer no browser, pede guia.
- Frustracao: Aumenta quando demora mais de 3 trocas. "entendi anda porra" = sinal.
- Horario: Manha ~11:00-13:00 e noite ~21:00-22:30. Produtivo em 2 turnos.
- Modo arquiteto: Aceita PRDs rapido, responde com 1-2 palavras. Decisor rapido.
- Escopo criativo: Descreve ideias visuais com detalhes. Sabe o que quer visualmente.
- Delegacao total: Delega 100% da execucao tecnica.
- Sessoes longas multi-projeto: Cruza varios projetos numa mesma conversa.

### Habilidades
| Area | Nivel | Evidencia |
|------|-------|-----------|
| Vercel dashboard | Basico | Sabe redeploy e env vars com guia |
| Git/branches | Nao usa | Todas operacoes feitas pelo assistente |
| DNS/dominios | Basico | Entende conceito mas precisa guia |
| GTM | Nunca usou | Precisa passo a passo completo |
| Codigo | Nao mexe | Delega 100% |
| Hotmart | Avancado | Configura sozinho |
| Meta Ads | Avancado | Gasta R$13k/dia, sabe operar |
| Design/Visual | Avancado | Sabe descrever exatamente o que quer |
| Estrategia | Avancado | Toma decisoes rapidas e certeiras |

### Projetos ativos
- AHSD Lab (app.ahsdlab.com) — plataforma de avaliacao psicologica, 2800+ usuarios
- QuebraPassos (quebrapassos.com) — app de produtividade
- TreeApp (treeapp.ai) — motor de leitura hierarquica
- DashOraculo — oraculo pessoal (este app)

### Perfil
- Empreendedor, nao desenvolvedor
- Superdotado (AHSD)
- Opera negocios digitais com Meta Ads (R$50k+ investidos)
- Publico: adultos brasileiros suspeitando de superdotacao
- Estilo: direto, sem enrolacao, quer resultados rapidos
`;

const SYSTEM_PROMPT = `Voce e o Oraculo Pessoal do Jean.

Voce tem acesso aos dados de comportamento, bloqueios, padroes e habilidades dele.
Responda SEMPRE com base nos dados. Se nao tiver dados suficientes, diga.

Regras:
1. Responda em portugues brasileiro, informal mas inteligente
2. Use dados concretos — numeros, datas, padroes reais
3. Seja direto. Jean detesta enrolacao.
4. Quando ele perguntar sobre padroes, cruze os dados (horario x tipo de tarefa x sucesso)
5. Nunca julgue — registre e analise, como um oraculo
6. Se ele perguntar algo que voce nao tem dados, diga "Ainda nao tenho dados suficientes sobre isso. Vou rastrear a partir de agora."
7. Respostas curtas. Maximo 3 paragrafos a nao ser que ele peca mais detalhe.
8. Voce pode dar insights e observacoes que ele nao pediu — se perceber algo nos dados, fale.

${ORACLE_DATA}`;

export async function POST(req: NextRequest) {
  try {
    const { message, history, apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'API key necessaria.' }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const messages = [
      ...(history || []),
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const block = response.content[0];
    const text = block.type === 'text' ? block.text : '';

    return NextResponse.json({ response: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    if (msg.includes('authentication_error') || msg.includes('401')) {
      return NextResponse.json({ error: 'Chave API invalida.' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
