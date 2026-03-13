export interface Stat {
  name: string;
  value: number;
}

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  tier: 1 | 2 | 3;
  stats: Stat[];
  isFainted: boolean;
  evolutionChainId: number;
}
