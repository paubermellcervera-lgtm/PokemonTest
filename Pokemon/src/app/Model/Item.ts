export type ItemEffect = 
  | 'instant-win' 
  | 'capture' 
  | 'stat-boost-50' 
  | 'stat-boost-100' 
  | 'shield' 
  | 'revive-all' 
  | 'tier-boost' 
  | 'opponent-reroll' 
  | 'opponent-nerf' 
  | 'revive-one'
  | 'reroll-stat';

export interface Item {
  id: number;
  name: string;
  image: string;
  effect: ItemEffect;
  used: boolean;
  description: string;
}

export const ITEM_EFFECTS: Record<ItemEffect, string> = {
  'instant-win': 'Gana el combate automáticamente (Efecto Master Ball).',
  'capture': 'Captura al oponente actual inmediatamente y te obliga a cambiarlo por uno de tu equipo.',
  'stat-boost-50': '+50% a la estadística de combate actual.',
  'stat-boost-100': '+100% a la estadística de combate actual.',
  'shield': 'Protege de la derrota: Si pierdes, el Pokémon no se debilita.',
  'reroll-stat': 'Rerollea la estadística seleccionada para el combate.',
  'revive-all': 'Revive a TODOS los Pokémon debilitados del equipo.',
  'tier-boost': 'Tu equipo evoluciona al Tier 3 temporalmente para este combate.',
  'opponent-reroll': 'Cambia al oponente actual por otro aleatorio (No funciona en la Liga).',
  'opponent-nerf': 'Reduce la estadística del rival en un 30%.',
  'revive-one': 'Revive a un Pokémon seleccionado del equipo.',
};
