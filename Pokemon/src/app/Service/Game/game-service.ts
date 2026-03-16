import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon, ALL_STATS } from '../../Model/Pokemon';
import { PokemonService } from '../Pokemon/pokemon-service';
import { StorageService } from '../storage-service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private pokemonService = inject(PokemonService);
  private storageService = inject(StorageService);
  private router = inject(Router);

  readonly team = signal<Pokemon[]>([]);
  readonly opponent = signal<Pokemon | null>(null);
  readonly defeatedOpponent = signal<Pokemon | null>(null);
  readonly victories = signal<number>(0);
  readonly totalVictories = signal<number>(0);
  readonly currentTier = signal<1 | 2 | 3>(1);
  readonly selectedStatId = signal<string>('');
  
  readonly rerolls = signal<number[]>([3, 3, 3]);
  readonly isSelectionPhase = signal<boolean>(true);

  // Estados para la animación de evolución
  readonly isEvolving = signal<boolean>(false);
  readonly evolvedTeamPreview = signal<Pokemon[]>([]);

  // Configuración de audio
  readonly volume = signal<number>(0.1); // Bajado al 10% para que sea suave

  readonly selectedStatName = computed(() => {
    const id = this.selectedStatId();
    return ALL_STATS.find(s => s.id === id)?.name || '';
  });

  readonly isGameOver = computed(() => 
    !this.isSelectionPhase() && 
    this.team().length > 0 && 
    this.team().every((p) => p.isFainted)
  );

  readonly canEvolve = computed(() => this.victories() >= 10 && this.currentTier() < 3);

  async initGame() {
    this.victories.set(0);
    this.totalVictories.set(0);
    this.currentTier.set(1);
    this.team.set([]);
    this.rerolls.set([3, 3, 3]);
    this.isSelectionPhase.set(true);
    this.isEvolving.set(false);
    this.opponent.set(null);
    this.defeatedOpponent.set(null);
    this.evolvedTeamPreview.set([]);
  }

  readonly loadingSlots = signal<boolean[]>([false, false, false]);

  async generatePokemonForSlot(index: number) {
    const currentRerolls = this.rerolls();
    if (currentRerolls[index] > 0) {
      this.loadingSlots.update(ls => {
        const newLs = [...ls];
        newLs[index] = true;
        return newLs;
      });
      try {
        const newPokemon = await this.pokemonService.getRandomPokemonByTier(this.currentTier());
        this.team.update(currentTeam => {
          const newTeam = [...currentTeam];
          while (newTeam.length <= index) newTeam.push(null as any);
          newTeam[index] = newPokemon;
          return newTeam.filter(p => p !== null);
        });
        const newRerolls = [...currentRerolls];
        newRerolls[index]--;
        this.rerolls.set(newRerolls);
      } finally {
        this.loadingSlots.update(ls => {
          const newLs = [...ls];
          newLs[index] = false;
          return newLs;
        });
      }
    }
  }

  async confirmTeam() {
    if (this.team().length === 3) {
      this.isSelectionPhase.set(false);
      await this.spawnOpponent();
    }
  }

  async spawnOpponent() {
    const rival = await this.pokemonService.getRandomPokemonByTier(this.currentTier());
    this.opponent.set(rival);
    this.generateRandomStat();

    // Reproducir grito
    if (rival.cry) {
      this.playCry(rival.cry);
    }
  }

  playCry(url: string) {
    const audio = new Audio(url);
    audio.volume = this.volume();
    audio.play().catch(e => console.warn('Error audio:', e));
  }

  generateRandomStat() {
    const randomIndex = Math.floor(Math.random() * ALL_STATS.length);
    this.selectedStatId.set(ALL_STATS[randomIndex].id);
  }

  async resolveBattle(playerPokemon: Pokemon): Promise<boolean> {
    const rival = this.opponent();
    const statId = this.selectedStatId();
    if (!rival || !statId) return false;

    const playerStatValue = playerPokemon.stats.find(s => s.name === statId)?.value || 0;
    const rivalStatValue = rival.stats.find(s => s.name === statId)?.value || 0;

    if (playerStatValue >= rivalStatValue) {
      await this.winBattle();
      return true;
    } else {
      this.updatePokemonStatus(playerPokemon.id, true);
      await this.spawnOpponent();
      return false;
    }
  }

  async winBattle() {
    this.victories.update(v => v + 1);
    this.totalVictories.update(v => v + 1);
    this.storageService.saveHighScore(this.totalVictories());
    
    this.defeatedOpponent.set(this.opponent());
    this.router.navigate(['/cambio']);
  }

  async applyReplacement(index: number | null) {
    if (index !== null) {
      const newPokemon = this.defeatedOpponent();
      if (newPokemon) {
        this.team.update(t => {
          const newTeam = [...t];
          newTeam[index] = { ...newPokemon, isFainted: false };
          return newTeam;
        });
      }
    }

    this.defeatedOpponent.set(null);
    if (this.canEvolve()) {
      await this.prepareEvolution();
    } else {
      await this.spawnOpponent();
      this.router.navigate(['/tablero']);
    }
  }

  private async prepareEvolution() {
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
    this.evolvedTeamPreview.set(evolvedTeam);
    this.isEvolving.set(true);
    this.router.navigate(['/tablero']);
  }

  completeEvolution() {
    this.team.set(this.evolvedTeamPreview());
    this.currentTier.update(t => (t + 1) as 1 | 2 | 3);
    this.victories.set(0);
    this.isEvolving.set(false);
    this.evolvedTeamPreview.set([]);
    this.spawnOpponent();
  }

  updatePokemonStatus(id: number, isFainted: boolean) {
    this.team.update(t => t.map(p => p.id === id ? { ...p, isFainted } : p));
  }
}
