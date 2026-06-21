// ============================================================
// CATÁLOGO DE NICHOS — o "leque" configurável que uma persona pode aderir.
//
// Dado PURO (sem dependência de services/providers) para evitar ciclos: é
// consumido pela camada de serviço (NicheService), pelo pipeline de conteúdo
// (ângulo + hashtags por nicho) e pelos providers (hashtags no mock).
//
// Uma persona escolhe um SUBCONJUNTO deste catálogo (campo Persona.niches) e
// pode ainda adicionar nichos CUSTOM (qualquer slug fora do catálogo é aceito).
// ============================================================

export interface NicheCatalogItem {
  slug: string; // identificador estável (kebab-case, sem acento)
  label: string; // rótulo exibido (PT-BR)
  category: string; // agrupamento para o "leque"
  hashtags: string[]; // hashtags sugeridas
  angle: string; // dica de ângulo de conteúdo (enriquece o prompt de geração)
}

export const NICHE_CATALOG: NicheCatalogItem[] = [
  // —— Saúde & Bem-estar ——
  { slug: 'saude', label: 'Saúde', category: 'Saúde & Bem-estar', hashtags: ['#saude', '#bemestar', '#vidasaudavel'], angle: 'hábitos saudáveis e qualidade de vida no dia a dia' },
  { slug: 'nutricao', label: 'Nutrição', category: 'Saúde & Bem-estar', hashtags: ['#nutricao', '#alimentacaosaudavel', '#receitafit'], angle: 'alimentação equilibrada, receitas e mitos sobre comida' },
  { slug: 'fitness', label: 'Fitness', category: 'Saúde & Bem-estar', hashtags: ['#fitness', '#treino', '#vidaativa'], angle: 'treinos, movimento e constância sem extremismo' },
  { slug: 'saude-mental', label: 'Saúde mental', category: 'Saúde & Bem-estar', hashtags: ['#saudemental', '#autocuidado', '#equilibrio'], angle: 'autocuidado, ansiedade e equilíbrio emocional (sem prescrição)' },
  { slug: 'yoga', label: 'Yoga & meditação', category: 'Saúde & Bem-estar', hashtags: ['#yoga', '#meditacao', '#mindfulness'], angle: 'respiração, presença e práticas de relaxamento' },

  // —— Moda & Beleza ——
  { slug: 'moda', label: 'Moda', category: 'Moda & Beleza', hashtags: ['#moda', '#look', '#ootd'], angle: 'looks, tendências e estilo acessível' },
  { slug: 'beleza', label: 'Beleza', category: 'Moda & Beleza', hashtags: ['#beleza', '#autocuidado', '#rotinadebeleza'], angle: 'rotina de beleza e autoestima' },
  { slug: 'skincare', label: 'Skincare', category: 'Moda & Beleza', hashtags: ['#skincare', '#cuidadoscomapele', '#peleperfeita'], angle: 'cuidados com a pele e ingredientes que funcionam' },
  { slug: 'maquiagem', label: 'Maquiagem', category: 'Moda & Beleza', hashtags: ['#maquiagem', '#makeup', '#tutorialdemake'], angle: 'tutoriais, produtos e truques de make' },
  { slug: 'cabelo', label: 'Cabelo', category: 'Moda & Beleza', hashtags: ['#cabelo', '#cuidadoscomocabelo', '#hairgoals'], angle: 'cuidados, cortes e penteados' },

  // —— Lifestyle & Casa ——
  { slug: 'lifestyle', label: 'Lifestyle', category: 'Lifestyle & Casa', hashtags: ['#lifestyle', '#rotina', '#diaadia'], angle: 'rotina, inspiração e bastidores do cotidiano' },
  { slug: 'viagens', label: 'Viagens', category: 'Lifestyle & Casa', hashtags: ['#viagem', '#trip', '#destinos'], angle: 'destinos, dicas de roteiro e experiências de viagem' },
  { slug: 'gastronomia', label: 'Gastronomia', category: 'Lifestyle & Casa', hashtags: ['#gastronomia', '#receita', '#comida'], angle: 'receitas, restaurantes e cultura da comida' },
  { slug: 'decoracao', label: 'Decoração', category: 'Lifestyle & Casa', hashtags: ['#decoracao', '#casa', '#interiores'], angle: 'ambientes, organização visual e DIY' },
  { slug: 'organizacao', label: 'Organização', category: 'Lifestyle & Casa', hashtags: ['#organizacao', '#minimalismo', '#produtividade'], angle: 'organizar a casa e a rotina sem estresse' },

  // —— Família & Relações ——
  { slug: 'maternidade', label: 'Maternidade', category: 'Família & Relações', hashtags: ['#maternidade', '#maes', '#vidademae'], angle: 'rotina materna real, dicas e desabafos' },
  { slug: 'pets', label: 'Pets', category: 'Família & Relações', hashtags: ['#pets', '#cachorro', '#gato'], angle: 'cuidados, comportamento e fofura dos bichos' },
  { slug: 'relacionamentos', label: 'Relacionamentos', category: 'Família & Relações', hashtags: ['#relacionamentos', '#amor', '#casal'], angle: 'vínculos, comunicação e vida a dois' },

  // —— Negócios & Tecnologia ——
  { slug: 'financas-pessoais', label: 'Finanças pessoais', category: 'Negócios & Tecnologia', hashtags: ['#financas', '#educacaofinanceira', '#investimentos'], angle: 'organizar o dinheiro, poupar e investir com clareza' },
  { slug: 'empreendedorismo', label: 'Empreendedorismo', category: 'Negócios & Tecnologia', hashtags: ['#empreendedorismo', '#negocios', '#empreender'], angle: 'tirar ideias do papel e bastidores de negócio' },
  { slug: 'tecnologia', label: 'Tecnologia', category: 'Negócios & Tecnologia', hashtags: ['#tecnologia', '#tech', '#inovacao'], angle: 'gadgets, apps e tendências de tecnologia' },
  { slug: 'produtividade', label: 'Produtividade', category: 'Negócios & Tecnologia', hashtags: ['#produtividade', '#foco', '#rotina'], angle: 'métodos, foco e gestão do tempo' },
  { slug: 'carreira', label: 'Carreira', category: 'Negócios & Tecnologia', hashtags: ['#carreira', '#trabalho', '#desenvolvimento'], angle: 'crescimento profissional e mercado de trabalho' },

  // —— Cultura & Entretenimento ——
  { slug: 'games', label: 'Games', category: 'Cultura & Entretenimento', hashtags: ['#games', '#gamer', '#jogos'], angle: 'jogos, novidades e cultura gamer' },
  { slug: 'musica', label: 'Música', category: 'Cultura & Entretenimento', hashtags: ['#musica', '#playlist', '#som'], angle: 'descobertas musicais e playlists' },
  { slug: 'livros', label: 'Livros', category: 'Cultura & Entretenimento', hashtags: ['#livros', '#leitura', '#dicasdelivro'], angle: 'resenhas, recomendações e hábito de leitura' },
  { slug: 'arte', label: 'Arte & criatividade', category: 'Cultura & Entretenimento', hashtags: ['#arte', '#criatividade', '#design'], angle: 'processo criativo, ilustração e design' },

  // —— Propósito ——
  { slug: 'sustentabilidade', label: 'Sustentabilidade', category: 'Propósito', hashtags: ['#sustentabilidade', '#consumoconsciente', '#ecofriendly'], angle: 'consumo consciente e hábitos sustentáveis' },
  { slug: 'autoconhecimento', label: 'Autoconhecimento', category: 'Propósito', hashtags: ['#autoconhecimento', '#desenvolvimentopessoal', '#proposito'], angle: 'reflexões, propósito e desenvolvimento pessoal' },
];

const BY_SLUG = new Map<string, NicheCatalogItem>(NICHE_CATALOG.map((n) => [n.slug, n]));

// Normaliza um texto livre para um slug estável (kebab-case, sem acento).
export function slugifyNiche(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Normaliza a lista de nichos de uma persona: slugifica, remove vazios e duplicados.
// Aceita slugs do catálogo E nichos custom (qualquer slug não-vazio).
export function normalizeNiches(niches: string[]): string[] {
  const out: string[] = [];
  for (const raw of niches) {
    const slug = slugifyNiche(String(raw));
    if (slug && !out.includes(slug)) out.push(slug);
  }
  return out;
}

export function resolveNiche(slug: string): NicheCatalogItem | undefined {
  return BY_SLUG.get(slug);
}

export function labelForNiche(slug: string): string {
  return resolveNiche(slug)?.label ?? slug;
}

export function angleForNiche(slug: string): string {
  return resolveNiche(slug)?.angle ?? `conteúdo de ${slug}`;
}

export function hashtagsForNiche(slug: string): string[] {
  return resolveNiche(slug)?.hashtags ?? [`#${slug.replace(/-/g, '')}`];
}

export interface NicheCatalogGroup {
  category: string;
  niches: NicheCatalogItem[];
}

// Catálogo agrupado por categoria (para o front renderizar o "leque").
export function listNicheCatalog(): { all: NicheCatalogItem[]; groups: NicheCatalogGroup[] } {
  const groups: NicheCatalogGroup[] = [];
  for (const item of NICHE_CATALOG) {
    let g = groups.find((x) => x.category === item.category);
    if (!g) {
      g = { category: item.category, niches: [] };
      groups.push(g);
    }
    g.niches.push(item);
  }
  return { all: NICHE_CATALOG, groups };
}
