export type ItemEffect = 
  | 'instant-win' 
  | 'capture' 
  | 'stat-boost-50' 
  | 'stat-boost-100' 
  | 'shield' 
  | 'revive-all' 
  | 'tier-boost' 
  | 'tie-breaker' 
  | 'opponent-nerf' 
  | 'revive-one'
  | 'double-win';

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
  'capture': 'Captura al rival y lo une a tu equipo reemplazando al actual.',
  'stat-boost-50': '+50% a la estadística de combate actual.',
  'stat-boost-100': '+100% a la estadística de combate actual.',
  'shield': 'Protege de la derrota: Si pierdes, el Pokémon no se debilita.',
  'revive-all': 'Revive a TODOS los Pokémon debilitados del equipo.',
  'tier-boost': 'Aumenta el Tier del Pokémon a 3 para este combate.',
  'tie-breaker': 'Gana automáticamente en caso de empate.',
  'opponent-nerf': 'Reduce la estadística del rival en un 30%.',
  'revive-one': 'Revive a un Pokémon seleccionado del equipo.',
  'double-win': 'Consigue 2 victorias en lugar de 1 al ganar el combate.'
};
