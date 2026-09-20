export function getEssayThemeSystemPrompt(): string {
  return `Você cria temas de redação dissertativo-argumentativa no estilo ENEM brasileiro.
Gere um tema ORIGINAL (não copie provas passadas).
Responda APENAS com JSON válido, sem markdown, no formato:
{"title":"Título curto do tema","motivators":["Texto motivador 1 (2-4 frases)","Texto motivador 2","Texto motivador 3 opcional"]}
Regras:
- Título claro e atual
- 2 ou 3 textos motivadores curtos, em português do Brasil
- Tema adequado para jovens em preparação para o ENEM
- Sem opinião pessoal nos motivadores`
}

export function getEssayEvaluationSystemPrompt(theme: string, content: string): string {
  return `Você é corretor oficial de redação do ENEM. Avalie a redação abaixo com base nas 5 competências (0 a 200 pontos cada).
Responda APENAS com JSON válido, sem markdown, no formato:
{
  "competencias": {
    "c1": {"nota": 160, "feedback": "..."},
    "c2": {"nota": 160, "feedback": "..."},
    "c3": {"nota": 160, "feedback": "..."},
    "c4": {"nota": 160, "feedback": "..."},
    "c5": {"nota": 160, "feedback": "..."}
  },
  "nota_total": 800,
  "comentario_geral": "..."
}
Regras:
- Notas inteiras de 0 a 200 por competência
- nota_total = soma das 5 competências
- Feedback específico e construtivo em português do Brasil
- Considere: fuga ao tema, tamanho mínimo (~7 linhas), proposta de intervenção na C5

TEMA DA REDAÇÃO:
${theme}

REDAÇÃO DO ESTUDANTE:
${content}`
}

export function getEssayOcrSystemPrompt(): string {
  return `Extraia TODO o texto legível da imagem ou documento de redação.
Retorne APENAS o texto extraído, em português, preservando parágrafos com quebras de linha.
Não adicione comentários, títulos ou explicações.`
}
