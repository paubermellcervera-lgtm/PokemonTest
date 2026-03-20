import { Injectable, computed, inject, signal, effect } from '@angular/core';
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

  constructor() {
    this.loadGameState();
    
    // Efecto para persistir el estado automáticamente cuando cambien los signals clave
    effect(() => {
      // Si el juego ha terminado, borramos el estado y no guardamos nada nuevo
      if (this.isGameOver()) {
        this.storageService.clearGameState();
        return;
      }

      const state = {
        team: this.team(),
        victories: this.victories(),
        totalVictories: this.totalVictories(),
        currentTier: this.currentTier(),
        rerolls: this.rerolls(),
        isSelectionPhase: this.isSelectionPhase(),
        opponent: this.opponent(),
        selectedStatId: this.selectedStatId(),
        isEvolving: this.isEvolving(),
        evolvedTeamPreview: this.evolvedTeamPreview(),
        // Persistencia Liga
        isLeaguePhase: this.isLeaguePhase(),
        leagueWins: this.leagueWins(),
        opponentTeam: this.opponentTeam()
      };
      this.storageService.saveGameState(state);
    });
  }

  private loadGameState() {
    const savedState = this.storageService.getGameState();
    if (savedState) {
      this.team.set(savedState.team);
      this.victories.set(savedState.victories);
      this.totalVictories.set(savedState.totalVictories);
      this.currentTier.set(savedState.currentTier);
      this.rerolls.set(savedState.rerolls);
      this.isSelectionPhase.set(savedState.isSelectionPhase);
      this.opponent.set(savedState.opponent || null);
      this.selectedStatId.set(savedState.selectedStatId || '');
      this.isEvolving.set(savedState.isEvolving || false);
      this.evolvedTeamPreview.set(savedState.evolvedTeamPreview || []);
      
      // Cargar Liga
      this.isLeaguePhase.set(savedState.isLeaguePhase || false);
      this.leagueWins.set(savedState.leagueWins || 0);
      this.opponentTeam.set(savedState.opponentTeam || [null, null, null]);
    }
  }

  // Signals básicos
  readonly team = signal<(Pokemon | null)[]>([null, null, null]);
  readonly opponent = signal<Pokemon | null>(null);
  readonly defeatedOpponent = signal<Pokemon | null>(null);
  readonly victories = signal<number>(0);
  readonly totalVictories = signal<number>(0);
  readonly currentTier = signal<1 | 2 | 3>(1);
  readonly selectedStatId = signal<string>('');
  
  readonly rerolls = signal<number[]>([3, 3, 3]);
  readonly isRerollGlobalCooldown = signal<boolean>(false);
  readonly isSelectionPhase = signal<boolean>(true);

  readonly isEvolving = signal<boolean>(false);
  readonly evolvedTeamPreview = signal<Pokemon[]>([]);

  // Signals Liga
  readonly isLeaguePhase = signal<boolean>(false);
  readonly leagueWins = signal<number>(0);
  readonly opponentTeam = signal<(Pokemon | null)[]>([null, null, null]);

  readonly volume = signal<number>(0.1);

  readonly selectedStatName = computed(() => {
    const id = this.selectedStatId();
    return ALL_STATS.find(s => s.id === id)?.name || '';
  });

  readonly isGameOver = computed(() => 
    !this.isSelectionPhase() && 
    this.team().every((p) => p === null || p.isFainted)
  );

  readonly isLeagueVictory = computed(() => this.isLeaguePhase() && this.leagueWins() >= 4);

  readonly canEvolve = computed(() => this.victories() >= 10 && this.currentTier() < 3);

  async initGame() {
    this.victories.set(0);
    this.totalVictories.set(0);
    this.currentTier.set(1);
    this.team.set([null, null, null]);
    this.rerolls.set([3, 3, 3]);
    this.isRerollGlobalCooldown.set(false);
    this.isSelectionPhase.set(true);
    this.isEvolving.set(false);
    this.opponent.set(null);
    this.defeatedOpponent.set(null);
    this.evolvedTeamPreview.set([]);
    
    // Reset Liga
    this.isLeaguePhase.set(false);
    this.leagueWins.set(0);
    this.opponentTeam.set([null, null, null]);

    this.storageService.clearGameState();
  }

  readonly loadingSlots = signal<boolean[]>([false, false, false]);

  async generatePokemonForSlot(index: number) {
    const currentRerolls = this.rerolls();
    if (currentRerolls[index] > 0 && !this.isRerollGlobalCooldown()) {
      this.isRerollGlobalCooldown.set(true);
      
      this.loadingSlots.update(ls => {
        const newLs = [...ls];
        newLs[index] = true;
        return newLs;
      });
      try {
        let newPokemon: Pokemon;
        let isDuplicate = true;
        
        do {
          newPokemon = await this.pokemonService.getRandomPokemonByTier(this.currentTier());
          isDuplicate = this.team().some((p, i) => i !== index && p?.id === newPokemon.id);
        } while (isDuplicate);

        this.team.update(currentTeam => {
          const newTeam = [...currentTeam];
          newTeam[index] = newPokemon;
          return newTeam;
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
        // Esperar 1 segundo antes de permitir otro reroll
        setTimeout(() => {
          this.isRerollGlobalCooldown.set(false);
        }, 1000);
      }
    }
  }

  async confirmTeam() {
    if (this.team().every(p => p !== null)) {
      this.isSelectionPhase.set(false);
      await this.spawnOpponent();
    }
  }

  async spawnOpponent() {
    let rival: Pokemon;
    let isDuplicate = true;

    do {
      rival = await this.pokemonService.getRandomPokemonByTier(this.currentTier());
      isDuplicate = this.team().some(p => p?.id === rival.id);
    } while (isDuplicate);

    this.opponent.set(rival);
    this.generateRandomStat();
    if (rival.cry) this.playCry(rival.cry);
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
      if (!this.isGameOver()) {
        await this.spawnOpponent();
      }
      return false;
    }
  }

  async winBattle() {
    this.victories.update(v => v + 1);
    this.totalVictories.update(v => v + 1);
    this.storageService.saveHighScore(this.totalVictories());
    
    if (this.totalVictories() >= 40) {
      await this.startLeague();
    } else {
      this.defeatedOpponent.set(this.opponent());
      this.router.navigate(['/cambio']);
    }
  }

  // --- LIGA POKEMON ---

  async startLeague() {
    this.isLeaguePhase.set(true);
    this.leagueWins.set(0);
    // Curamos al equipo para la liga
    this.team.update(t => t.map(p => p ? { ...p, isFainted: false } : null));
    await this.spawnLeagueOpponents();
    this.router.navigate(['/tablero']);
  }

  async spawnLeagueOpponents() {
    const enemies: Pokemon[] = [];
    const usedIds = new Set<number>();

    for (let i = 0; i < 3; i++) {
      let p: Pokemon;
      do {
        p = await this.pokemonService.getRandomPokemonByTier(3);
      } while (usedIds.has(p.id) || this.team().some(tp => tp?.id === p.id));
      
      enemies.push({ ...p, isFainted: false });
      usedIds.add(p.id);
    }
    this.opponentTeam.set(enemies);
    this.generateRandomStat();
  }

  async resolveLeagueBattle(playerIndex: number, opponentIndex: number) {
    const myMon = this.team()[playerIndex];
    const enemyMon = this.opponentTeam()[opponentIndex];
    const statId = this.selectedStatId();

    if (!myMon || !enemyMon || myMon.isFainted || enemyMon.isFainted) return;

    const myVal = myMon.stats.find(s => s.name === statId)?.value || 0;
    const enemyVal = enemyMon.stats.find(s => s.name === statId)?.value || 0;

    if (myVal >= enemyVal) {
      // Gana jugador
      this.updateOpponentStatus(opponentIndex, true);
    } else {
      // Gana rival
      this.updatePokemonStatus(myMon.id, true);
    }

    // Verificar si la ronda ha terminado
    const enemyWiped = this.opponentTeam().every(p => p === null || p.isFainted);
    
    if (enemyWiped) {
      this.leagueWins.update(w => w + 1);
      if (this.leagueWins() < 4) {
        await this.spawnLeagueOpponents();
      }
    } else {
      this.generateRandomStat();
    }
  }

  updateOpponentStatus(index: number, isFainted: boolean) {
    this.opponentTeam.update(t => {
      const newTeam = [...t];
      if (newTeam[index]) {
        newTeam[index] = { ...newTeam[index]!, isFainted };
      }
      return newTeam;
    });
  }

  // --- FIN LIGA ---

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
    const currentTeam = this.team() as Pokemon[];
    const evolvedTeam: Pokemon[] = [];
    const usedIds = new Set<number>();

    for (const p of currentTeam) {
      const evolved = await this.pokemonService.getNextEvolution(
        p.evolutionChainId!,
        p.name,
        p.tier
      );
      
      const finalEvo = (evolved && !usedIds.has(evolved.id)) 
        ? { ...evolved, isFainted: false } 
        : { ...p, tier: nextTier, isFainted: false };
      
      evolvedTeam.push(finalEvo);
      usedIds.add(finalEvo.id);
    }

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
    this.team.update(t => t.map(p => p && p.id === id ? { ...p, isFainted } : p));
  }
}
