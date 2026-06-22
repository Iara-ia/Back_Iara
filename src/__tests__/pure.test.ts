import { describe, it, expect } from 'vitest';
import {
  slugifyNiche,
  normalizeNiches,
  hashtagsForNiche,
  labelForNiche,
  listNicheCatalog,
} from '../lib/niches';
import { distributePilares, DEFAULT_PILARES } from '../services/pilarMix';

describe('niches (leque configurável)', () => {
  it('slugify remove acento e espaços', () => {
    expect(slugifyNiche('Saúde Mental')).toBe('saude-mental');
    expect(slugifyNiche('  Jiu Jitsu ')).toBe('jiu-jitsu');
    expect(slugifyNiche('Finanças')).toBe('financas');
  });

  it('normalize: slugifica, deduplica e remove vazios', () => {
    expect(normalizeNiches(['Moda', 'moda', 'Pets', 'pets', 'Saúde', '   '])).toEqual([
      'moda',
      'pets',
      'saude',
    ]);
  });

  it('catálogo tem várias categorias e itens', () => {
    const c = listNicheCatalog();
    expect(c.all.length).toBeGreaterThan(20);
    expect(c.groups.length).toBeGreaterThanOrEqual(5);
    // cada item do grupo está no all
    for (const g of c.groups) {
      for (const n of g.niches) expect(c.all.some((x) => x.slug === n.slug)).toBe(true);
    }
  });

  it('hashtags: do catálogo e fallback para nicho custom', () => {
    expect(hashtagsForNiche('saude-mental').length).toBeGreaterThan(0);
    expect(hashtagsForNiche('jiu-jitsu')[0]).toContain('#');
    expect(labelForNiche('financas-pessoais')).toBe('Finanças pessoais');
    expect(labelForNiche('nicho-inexistente')).toBe('nicho-inexistente');
  });
});

describe('pilarMix (B5 — mix de pilares)', () => {
  it('distribui determinístico e equilibrado (diferença máx. 1)', () => {
    const out = distributePilares(7, ['a', 'b']);
    expect(out.length).toBe(7);
    const counts = out.reduce<Record<string, number>>((m, x) => {
      m[x] = (m[x] ?? 0) + 1;
      return m;
    }, {});
    expect(Math.abs((counts['a'] ?? 0) - (counts['b'] ?? 0))).toBeLessThanOrEqual(1);
  });

  it('mesma entrada → mesma saída (determinístico)', () => {
    expect(distributePilares(5, ['x', 'y', 'z'])).toEqual(distributePilares(5, ['x', 'y', 'z']));
  });

  it('cai no default quando o pool é vazio', () => {
    expect(distributePilares(1)).toEqual([DEFAULT_PILARES[0]]);
  });
});
