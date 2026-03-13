import { Injectable, computed, inject, signal } from '@angular/core';
import { Pokemon } from '../../Model/Pokemon';
import { PokemonService } from '../Pokemon/pokemon-service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private pokemonService = inject(PokemonService);

  readonly team = signal<Pokemon[]>([]);
  readonly opponent = signal<Pokemon | null>(null);
  readonly victories = signal<number>(0);
  readonly currentTier = signal<1 | 2 | 3>(1);
  readonly selectedStat = signal<string>('');

  readonly isGameOver = computed(() => this.team().length > 0 && this.team().every((p) => p.isFainted));
  readonly canEvolve = computed(() => this.victories() >= 10 && this.currentTier() < 3);

  async initGame() {
    this.victories.set(0);
    this.currentTier.set(1);
    
    const newTeam = await Promise.all([
      this.pokemonService.getRandomPokemonByTier(1),
      this.pokemonService.getRandomPokemonByTier(1),
      this.pokemonService.getRandomPokemonByTier(1),
    ]);
    this.team.set(newTeam);
    
    await this.spawnOpponent();
  }

  async spawnOpponent() {
    const rival = await this.pokemonService.getRandomPokemonByTier(this.currentTier());
    this.opponent.set(rival);
    this.generateRandomStat();
  }

  generateRandomStat() {
    const rival = this.opponent();
    if (rival && rival.stats.length > 0) {
      const randomIndex = Math.floor(Math.random() * rival.stats.length);
      this.selectedStat.set(rival.stats[randomIndex].name);
    }
  }

 
  resolveBattle(playerPokemon: Pokemon): boolean {
    const rival = this.opponent();
    const statName = this.selectedStat();

    if (!rival || !statName) return false;

    const playerStatValue = playerPokemon.stats.find(s => s.name === statName)?.value || 0;
    const rivalStatValue = rival.stats.find(s => s.name === statName)?.value || 0;

    if (playerStatValue >= rivalStatValue) {
      this.winBattle();
      return true;
    } else {
      this.updatePokemonStatus(playerPokemon.id, true);
      this.generateRandomStat();
      return false;
    }
  }

  async winBattle(capturedPokemon?: boolean) {
    this.victories.update(v => v + 1);
    
    if (this.canEvolve()) {
      await this.evolveTeam();
    } else {
      await this.spawnOpponent();
    }
  }

  async evolveTeam() {
    const nextTier = (this.currentTier() + 1) as 1 | 2 | 3;
    const evolvedTeam = await Promise.all(
      this.team().map(async (p) => {
        const evolved = await this.pokemonService.getNextEvolution(
          p.evolutionChainId!,
          p.name,
          p.tier
        );
        return evolved ? { ...evolved, isFainted: false } : { ...p, tier: nextTier, isFainted: false };
      })
    );
    
    this.team.set(evolvedTeam);
    this.currentTier.set(nextTier);
    this.victories.set(0); 
    await this.spawnOpponent();
  }

  updatePokemonStatus(id: number, isFainted: boolean) {
    this.team.update(t => t.map(p => p.id === id ? { ...p, isFainted } : p));
  }

  replacePokemon(oldId: number, newPokemon: Pokemon) {
    this.team.update(t => t.map(p => p.id === oldId ? newPokemon : p));
  }
}
