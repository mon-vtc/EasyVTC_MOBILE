/**
 * Tests unitaires — formatRelativeTime (src/utils/formatDate.ts)
 *
 * Garantit que l'unité (seconde/minute/heure/jour/mois/an) est toujours
 * précisée — régression du bug où l'app affichait "il y a 1" sans unité.
 */

import { formatRelativeTime } from '../../utils/formatDate';

const secondsAgo = (s: number) => new Date(Date.now() - s * 1000);

describe('formatRelativeTime', () => {
  it("moins de 5 secondes → à l'instant", () => {
    expect(formatRelativeTime(secondsAgo(2))).toBe("à l'instant");
  });

  it('date future (désync horloge) → à l\'instant', () => {
    expect(formatRelativeTime(new Date(Date.now() + 10_000))).toBe("à l'instant");
  });

  it('30 secondes → il y a 30 secondes', () => {
    expect(formatRelativeTime(secondsAgo(30))).toBe('il y a 30 secondes');
  });

  it('1 minute pile → il y a 1 minute (singulier)', () => {
    expect(formatRelativeTime(secondsAgo(60))).toBe('il y a 1 minute');
  });

  it('2 minutes → il y a 2 minutes (pluriel)', () => {
    expect(formatRelativeTime(secondsAgo(120))).toBe('il y a 2 minutes');
  });

  it('59 minutes → il y a 59 minutes', () => {
    expect(formatRelativeTime(secondsAgo(59 * 60))).toBe('il y a 59 minutes');
  });

  it('1 heure pile → il y a 1 heure (singulier)', () => {
    expect(formatRelativeTime(secondsAgo(3600))).toBe('il y a 1 heure');
  });

  it('5 heures → il y a 5 heures', () => {
    expect(formatRelativeTime(secondsAgo(5 * 3600))).toBe('il y a 5 heures');
  });

  it('1 jour pile → il y a 1 jour (singulier)', () => {
    expect(formatRelativeTime(secondsAgo(86400))).toBe('il y a 1 jour');
  });

  it('3 jours → il y a 3 jours', () => {
    expect(formatRelativeTime(secondsAgo(3 * 86400))).toBe('il y a 3 jours');
  });

  it('2 mois → il y a 2 mois (invariable)', () => {
    expect(formatRelativeTime(secondsAgo(60 * 86400))).toBe('il y a 2 mois');
  });

  it('2 ans → il y a 2 ans', () => {
    expect(formatRelativeTime(secondsAgo(2 * 365 * 86400))).toBe('il y a 2 ans');
  });

  it('accepte une chaîne ISO en plus d\'un objet Date', () => {
    const iso = secondsAgo(120).toISOString();
    expect(formatRelativeTime(iso)).toBe('il y a 2 minutes');
  });
});
