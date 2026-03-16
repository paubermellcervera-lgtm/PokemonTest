import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Pokemon } from '../../Model/Pokemon';

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

 
  private extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
