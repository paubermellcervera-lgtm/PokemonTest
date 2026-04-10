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
  private HiResImg = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
  async getPokemonById(id: number | string, tier: 1 | 2 | 3, forcedShiny?: boolean): Promise<Pokemon> {
    const data: any = await firstValueFrom(this.http.get(`${this.baseUrl}/pokemon/${id}`));
    const speciesData: any = await firstValueFrom(this.http.get(data.species.url));
    const ShinyChance = 0.10; // 10% de probabilidad de ser shiny
    const isShiny = forcedShiny !== undefined ? forcedShiny : Math.random() < ShinyChance;
    const imageUrl = isShiny ? data.sprites.front_shiny : data.sprites.front_default;
    const chainId = this.extractIdFromUrl(speciesData.evolution_chain.url);

    return {
      id: data.id,
      name: data.name,
      image: imageUrl, // Sprite shiny o clásico
      cry: data.cries?.latest, // Grito del pokemon
      tier: tier,
      types: data.types.map((t: any) => t.type.name),
      isFainted: false,
      evolutionChainId: chainId,
      weight: data.weight,
      isShiny: isShiny,
      stats: data.stats.map((s: any) => ({
        name: s.stat.name,
        value: s.base_stat,
      })),
    };
  }

  getHiResImg(id: number, isShiny?: boolean): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${isShiny ? 'shiny/' : ''}${id}.png`;
  }

  async getHiResImageUrl(id: number, isShiny: boolean): Promise<string> {
    if (isShiny) {
      return `${this.HiResImg}shiny/${id}-shiny.png`;
    }
    return `${this.HiResImg}${id}.png`;
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
        // Silently catch errors from invalid chain IDs
      }
    }
    return family;
  }

  async getRandomPokemonByTier(tier: 1 | 2 | 3): Promise<Pokemon> {
    const family = await this.getRandom3StageFamily();
    const id = tier === 1 ? family.t1 : tier === 2 ? family.t2 : family.t3;
    return this.getPokemonById(id, tier);
  }

  async getNextEvolution(chainId: number, currentName: string, currentTier: number, forcedShiny?: boolean): Promise<Pokemon | null> {
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
        return this.getPokemonById(nextId, (currentTier + 1) as 1 | 2 | 3, forcedShiny);
      }
    } catch (e) {
      console.error('Error en el proceso de evolución:', e);
    }
    return null;
  }

  async getFamilyByChainId(chainId: number, forcedShiny?: boolean): Promise<Pokemon[]> {
    try {
      const chainData: any = await firstValueFrom(
        this.http.get(`${this.baseUrl}/evolution-chain/${chainId}/`)
      );
      
      const family: Pokemon[] = [];
      
      // Stage 1
      const s1Id = this.extractIdFromUrl(chainData.chain.species.url);
      family.push(await this.getPokemonById(s1Id, 1, forcedShiny));
      
      // Stage 2
      if (chainData.chain.evolves_to.length > 0) {
        const s2Id = this.extractIdFromUrl(chainData.chain.evolves_to[0].species.url);
        family.push(await this.getPokemonById(s2Id, 2, forcedShiny));
        
        // Stage 3
        if (chainData.chain.evolves_to[0].evolves_to.length > 0) {
          const s3Id = this.extractIdFromUrl(chainData.chain.evolves_to[0].evolves_to[0].species.url);
          family.push(await this.getPokemonById(s3Id, 3, forcedShiny));
        }
      }
      
      return family;
    } catch (e) {
      console.error('Error fetching family:', e);
      return [];
    }
  }

  async getRandomItems(count: number): Promise<Item[]> {
    const itemPool: Record<number, ItemEffect> = {
      1: 'instant-win',   // Master Ball
      2: 'capture',       // Ultra Ball
      57: 'stat-boost-50', // X-Attack
      201: 'stat-boost-100', // Choice Band
      207: 'reroll-stat', // Focus Band
      29: 'revive-all',   // Max Revive
      50: 'tier-boost',   // Rare Candy
      70: 'opponent-reroll', // Escape Rope
      28: 'revive-one',    // Revive
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

  async getMegaEvolutions(pokemonName: string, tier: 1 | 2 | 3, forcedShiny?: boolean): Promise<Pokemon[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${this.baseUrl}/pokemon/${pokemonName}`));
      const speciesResponse: any = await firstValueFrom(this.http.get(response.species.url));
      
      const megaVarieties = speciesResponse.varieties.filter((v: any) => v.pokemon.name.includes('-mega'));
      const megas: Pokemon[] = [];

      for (const variety of megaVarieties) {
        const megaData = await this.getPokemonById(variety.pokemon.name, tier, forcedShiny);
        megas.push(megaData);
      }

      return megas;
    } catch (e) {
      console.error(`Error fetching megas for ${pokemonName}:`, e);
      return [];
    }
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
