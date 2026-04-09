export interface Stat {
  name: string;
  value: number;
}

export const ALL_STATS = [
  { id: 'hp', name: 'HP', shorthand: 'PS' },
  { id: 'attack', name: 'Ataque', shorthand: 'Atq' },
  { id: 'defense', name: 'Defensa', shorthand: 'Def' },
  { id: 'special-attack', name: 'At. Especial', shorthand: 'At.Esp' },
  { id: 'special-defense', name: 'Def. Especial', shorthand: 'Def.Esp' },
  { id: 'speed', name: 'Velocidad', shorthand: 'Vel' }
];

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  cry?: string;
  tier: 1 | 2 | 3;
  types: string[];
  stats: Stat[];
  weight: number;
  isFainted: boolean;
  evolutionChainId: number;
  isShiny?: boolean;
}
