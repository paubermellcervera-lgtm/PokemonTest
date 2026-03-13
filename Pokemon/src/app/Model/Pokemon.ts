export interface Stat {
  name: string;
  value: number;
}

export const ALL_STATS = [
  { id: 'hp', name: 'HP' },
  { id: 'attack', name: 'Ataque' },
  { id: 'defense', name: 'Defensa' },
  { id: 'special-attack', name: 'At. Especial' },
  { id: 'special-defense', name: 'Def. Especial' },
  { id: 'speed', name: 'Velocidad' }
];

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  tier: 1 | 2 | 3;
  stats: Stat[];
  isFainted: boolean;
  evolutionChainId: number;
}
