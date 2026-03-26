import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from '../../Model/Pokemon';
import { Item, ITEM_EFFECTS, ItemEffect } from '../../Model/Item';

@Injectable({
  providedIn: 'root',
})
export class PokemonService {
  private http = inject(HttpClient);
  private baseUrl = 'https://pokeapi.co/api/v2';

  
  async getPokemonById(id: number | string, tier: 1 | 2 | 3): Promise<Pokemon> {
    const data: any = await firstValueFrom(this.http.get(`${this.baseUrl}/pokemon/${id}`));
    const speciesData: any = await firstValueFrom(this.http.get(data.species.url));
    
    const chainId = this.extractIdFromUrl(speciesData.evolution_chain.url);

    return {
      id: data.id,
      name: data.name,
      image: data.sprites.front_default, // Sprite clásico
      cry: data.cries?.latest, // Grito del pokemon
      tier: tier,
      types: data.types.map((t: any) => t.type.name),
      isFainted: false,
      evolutionChainId: chainId,
      stats: data.stats.map((s: any) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
    };
  }

  
  async getRandom3StageFamily(): Promise<{ t1: number; t2: number; t3: number }> {
    let found = false;
    let family = { t1: 0, t2: 0, t3: 0 };

    while (!found) {
      const randomChainId = Math.floor(Math.random() * 541) + 1;
      try {
        const chainData: any = await firstValueFrom(
          this.http.get(`${this.baseUrl}/evolution-chain/${randomChainId}/`)
        );

        const stage1 = chainData.chain;
        
        if (stage1 && stage1.evolves_to.length > 0) {
          const stage2 = stage1.evolves_to[0];
          
         
          if (stage2.evolves_to.length > 0) {
            const stage3 = stage2.evolves_to[0];
            
            if (stage3.evolves_to.length === 0) {
              family.t1 = this.extractIdFromUrl(stage1.species.url);
              family.t2 = this.extractIdFromUrl(stage2.species.url);
              family.t3 = this.extractIdFromUrl(stage3.species.url);
              found = true;
            }
          }
        }
      } catch (e) {
        
      }
    }
    return family;
  }

  
  async getRandomPokemonByTier(tier: 1 | 2 | 3): Promise<Pokemon> {
    const family = await this.getRandom3StageFamily();
    const id = tier === 1 ? family.t1 : tier === 2 ? family.t2 : family.t3;
    return this.getPokemonById(id, tier);
  }

  
  async getNextEvolution(chainId: number, currentName: string, currentTier: number): Promise<Pokemon | null> {
    try {
      const chainData: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/evolution-chain/${chainId}/`)
      );
      
      let current = chainData.chain;

      while (current && current.species.name !== currentName && current.evolves_to.length > 0) {
        current = current.evolves_to[0];
      }

      if (current && current.species.name === currentName && current.evolves_to.length > 0) {
        const nextId = this.extractIdFromUrl(current.evolves_to[0].species.url);
        return this.getPokemonById(nextId, (currentTier + 1) as 1 | 2 | 3);
      }
    } catch (e) {
      console.error('Error en el proceso de evolución:', e);
    }
    return null;
  }

  async getRandomItems(count: number): Promise<Item[]> {
    const itemPool: Record<number, ItemEffect> = {
      1: 'instant-win',   // Master Ball
      2: 'capture',       // Ultra Ball
      57: 'stat-boost-50', // X-Attack
      201: 'stat-boost-100', // Choice Band
      207: 'shield',      // Focus Band
      29: 'revive-all',   // Max Revive
      50: 'tier-boost',   // Rare Candy
      190: 'tie-breaker',  // Quick Claw
      28: 'revive-one',    // Revive
      153: 'double-win'    // Amulet Coin
    };

    const ids = Object.keys(itemPool).map(Number);
    const selectedIds: number[] = [];
    const items: Item[] = [];

    while (selectedIds.length < count) {
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      if (!selectedIds.includes(randomId)) {
        selectedIds.push(randomId);
      }
    }
    
    for (const id of selectedIds) {
      try {
        const data: any = await firstValueFrom(this.http.get(`${this.baseUrl}/item/${id}`));
        const effect = itemPool[id];
        
        items.push({
          id: data.id,
          name: data.names.find((n: any) => n.language.name === 'es')?.name || data.name,
          image: data.sprites.default,
          effect: effect,
          used: false,
          description: ITEM_EFFECTS[effect]
        });
      } catch (e) {
        console.error(`Error fetching item ${id}:`, e);
      }
    }
    return items;
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
