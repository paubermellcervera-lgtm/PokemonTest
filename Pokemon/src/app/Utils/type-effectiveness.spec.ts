import { getTypeEffectiveness, getMaxTypeEffectiveness } from './type-effectiveness';

describe('Type Effectiveness Logic', () => {
  it('should calculate direct super effective (x2)', () => {
    expect(getTypeEffectiveness('fire', ['grass'])).toBe(2);
    expect(getTypeEffectiveness('water', ['fire'])).toBe(2);
    expect(getTypeEffectiveness('electric', ['water'])).toBe(2);
  });

  it('should calculate double super effective (x4)', () => {
    // Charizard is Fire/Flying. Rock is x2 against Fire and x2 against Flying.
    expect(getTypeEffectiveness('rock', ['fire', 'flying'])).toBe(4);
  });

  it('should calculate not very effective (x0.5)', () => {
    expect(getTypeEffectiveness('fire', ['water'])).toBe(0.5);
    expect(getTypeEffectiveness('grass', ['fire'])).toBe(0.5);
  });

  it('should calculate immune (x0)', () => {
    expect(getTypeEffectiveness('normal', ['ghost'])).toBe(0);
    expect(getTypeEffectiveness('electric', ['ground'])).toBe(0);
  });

  it('should return 1 for neutral hits', () => {
    expect(getTypeEffectiveness('normal', ['water'])).toBe(1);
    expect(getTypeEffectiveness('fire', ['electric'])).toBe(1);
  });

  it('should get max effectiveness for attacker with multiple types', () => {
    // Bulbasaur (Grass/Poison) vs Squirtle (Water)
    // Grass is x2, Poison is x1. Max should be 2.
    expect(getMaxTypeEffectiveness(['grass', 'poison'], ['water'])).toBe(2);
  });
});
