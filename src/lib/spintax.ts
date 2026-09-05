/**
 * Motor de Spintax para Variação de Legendas e Textos
 *
 * Suporta sintaxe no formato:
 * {Opção 1|Opção 2|Opção 3}
 * com suporte a aninhamento, ex:
 * {{Olá|Oi|Fala}, {amigo|galera}|E aí pessoal}!
 */

/**
 * Verifica se um texto possui padrões de Spintax
 */
export function hasSpintax(text: string): boolean {
  if (!text) return false;
  return /\{[^{}]*\|[^{}]*\}/.test(text);
}

/**
 * Renderiza uma variação aleatória a partir de um template Spintax
 */
export function renderSpintax(template: string): string {
  if (!template || typeof template !== "string") return "";

  let result = template;
  const spintaxRegex = /\{([^{}]+)\}/;

  let match: RegExpExecArray | null;
  // Resolve de dentro para fora para suportar aninhamento
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while ((match = spintaxRegex.exec(result)) !== null && iterations < MAX_ITERATIONS) {
    iterations++;
    const fullMatch = match[0];
    const options = match[1].split("|");
    const chosen = options[Math.floor(Math.random() * options.length)];
    result = result.slice(0, match.index) + chosen + result.slice(match.index + fullMatch.length);
  }

  return result;
}

/**
 * Gera múltiplos exemplos diferentes de um template Spintax para preview na UI
 */
export function generateSpintaxSamples(template: string, count: number = 3): string[] {
  if (!template) return [];
  if (!hasSpintax(template)) return [template];

  const samples = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 10;

  while (samples.size < count && attempts < maxAttempts) {
    attempts++;
    samples.add(renderSpintax(template));
  }

  return Array.from(samples);
}
