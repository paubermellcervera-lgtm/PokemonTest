import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Pokemon, ALL_STATS } from '../../Model/Pokemon';
import { Item } from '../../Model/Item';
import { PokemonService } from '../Pokemon/pokemon-service';
import { StorageService } from '../storage-service';
import { getMaxTypeEffectiveness } from '../../Utils/type-effectiveness';

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
        opponentTeam: this.opponentTeam(),
        // Persistencia Objetos
        items: this.items()
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

      // Cargar Objetos
      this.items.set(savedState.items || []);
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
  readonly isRerollSlotCooldown = signal<boolean[]>([false, false, false]);
  readonly isSelectionPhase = signal<boolean>(true);

  readonly isEvolving = signal<boolean>(false);
  readonly evolvedTeamPreview = signal<Pokemon[]>([]);
  readonly boostedTeam = signal<(Pokemon | null)[]>([null, null, null]);
  readonly boostedOpponent = signal<Pokemon | null>(null);
  readonly isTierBoostActive = signal<boolean>(false);

  // Signal que devuelve el equipo actual (real o potenciado)
  readonly effectiveTeam = computed(() => {
    return this.isTierBoostActive() ? this.boostedTeam() : this.team();
  });

  readonly effectiveOpponent = computed(() => {
    return this.isTierBoostActive() ? this.boostedOpponent() : this.opponent();
  });

  // Signals Objetos
  readonly items = signal<Item[]>([]);
  readonly selectedItemForBattle = signal<Item | null>(null);
  readonly isForcedCapture = signal<boolean>(false);

  // Signals Liga
  readonly isLeaguePhase = signal<boolean>(false);
  readonly leagueWins = signal<number>(0);
  readonly opponentTeam = signal<(Pokemon | null)[]>([null, null, null]);
  readonly isExchangePhase = signal<boolean>(false);
  readonly showLeagueAnnouncement = signal<boolean>(false);
  private hasSavedHallOfFame = false;

  readonly volume = signal<number>(0.1);

  readonly selectedStatName = computed(() => {
    const id = this.selectedStatId();
    return ALL_STATS.find(s => s.id === id)?.name || '';
  });

  readonly isGameOver = computed(() => 
    !this.isSelectionPhase() && 
    this.team().every((p) => p === null || p.isFainted)
  );

  readonly isLeagueVictory = computed(() => {
    const victory = this.isLeaguePhase() && this.leagueWins() >= 4;
    if (victory && !this.hasSavedHallOfFame) {
      this.hasSavedHallOfFame = true;
      const currentTeam = this.team().filter(p => p !== null) as Pokemon[];
      this.storageService.saveHallOfFame(currentTeam);
    }
    return victory;
  });

  readonly canEvolve = computed(() => this.victories() >= 10 && this.currentTier() < 3);

  async initGame() {
    this.victories.set(0);
    this.totalVictories.set(0);
    this.currentTier.set(1);
    this.team.set([null, null, null]);
    this.rerolls.set([3, 3, 3]);
    this.isRerollSlotCooldown.set([false, false, false]);
    this.isSelectionPhase.set(true);
    this.isEvolving.set(false);
    this.opponent.set(null);
    this.defeatedOpponent.set(null);
    this.evolvedTeamPreview.set([]);
    this.hasSavedHallOfFame = false;
    
    // Reset Boosts
    this.isTierBoostActive.set(false);
    this.boostedTeam.set([null, null, null]);
    this.boostedOpponent.set(null);
    this.selectedItemForBattle.set(null);

    // Reset Liga
    this.isLeaguePhase.set(false);
    this.leagueWins.set(0);
    this.opponentTeam.set([null, null, null]);

    // Generar Objetos
    const newItems = await this.pokemonService.getRandomItems(3);
    this.items.set(newItems);

    this.storageService.clearGameState();
  }

  readonly loadingSlots = signal<boolean[]>([false, false, false]);
  readonly loadingOpponent = signal<boolean>(false);
  readonly loadingLeagueSlots = signal<boolean[]>([false, false, false]);

  async generatePokemonForSlot(index: number) {
    const currentRerolls = this.rerolls();
    const currentCooldowns = this.isRerollSlotCooldown();
    
    // Si es el primer roll (rerolls === 3), no hay timeout.
    // Si no, comprobamos el cooldown individual del slot.
    const isFirstRoll = currentRerolls[index] === 3;
    
    if (currentRerolls[index] > 0 && (isFirstRoll || !currentCooldowns[index])) {
      
      // Activar cooldown solo si NO es el primer roll
      if (!isFirstRoll) {
        this.isRerollSlotCooldown.update(cv => {
          const newCv = [...cv];
          newCv[index] = true;
          return newCv;
        });
      }
      
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

        // Limpiar cooldown individual después de 1s si se activó
        if (!isFirstRoll) {
          setTimeout(() => {
            this.isRerollSlotCooldown.update(cv => {
              const newCv = [...cv];
              newCv[index] = false;
              return newCv;
            });
          }, 1000);
        }
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
    this.loadingOpponent.set(true);
    try {
      let rival: Pokemon;
      let isDuplicate = true;

      do {
        rival = await this.pokemonService.getRandomPokemonByTier(this.currentTier());
        isDuplicate = this.team().some(p => p?.id === rival.id);
      } while (isDuplicate);

      this.opponent.set(rival);
      this.generateRandomStat();
      if (rival.cry) this.playCry(rival.cry);
    } finally {
      this.loadingOpponent.set(false);
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

  useItem(item: Item) {
    if (item.used) return;
    this.selectedItemForBattle.set(item);
  }

  async applyTierBoost() {
    const item = this.selectedItemForBattle();
    if (item?.effect === 'tier-boost') {
      const currentTeam = this.team();
      const boosted: (Pokemon | null)[] = [];

      for (const p of currentTeam) {
        if (!p) {
          boosted.push(null);
          continue;
        }
        boosted.push(await this.getTier3Version(p));
      }

      // Boost del Rival actual
      const rival = this.opponent();
      if (rival) {
        this.boostedOpponent.set(await this.getTier3Version(rival));
      }

      this.boostedTeam.set(boosted);
      this.isTierBoostActive.set(true);
      this.consumeItem(item.id);
    }
  }

  private async getTier3Version(p: Pokemon): Promise<Pokemon> {
    // Buscar la evolución final (Tier 3)
    let evolved = await this.pokemonService.getNextEvolution(p.evolutionChainId!, p.name, p.tier);
    if (evolved && evolved.tier < 3) {
      const finalEvo = await this.pokemonService.getNextEvolution(evolved.evolutionChainId!, evolved.name, evolved.tier);
      if (finalEvo) evolved = finalEvo;
    }
    // Si no hay evolución o ya es Tier 3, se queda igual pero con stats de Tier 3 (simulado)
    return evolved ? { ...evolved, isFainted: p.isFainted } : { ...p, tier: 3 };
  }

  async applyInstantWin() {
    const item = this.selectedItemForBattle();
    if (item?.effect === 'instant-win') {
      this.consumeItem(item.id);
      
      if (this.isLeaguePhase()) {
        const opponentIndex = this.opponentTeam().findIndex(p => p && !p.isFainted);
        if (opponentIndex !== -1) {
          this.updateOpponentStatus(opponentIndex, true);
          this.checkLeagueRoundEnd();
        }
      } else {
        await this.winBattle();
      }
    }
  }

  async applyForceCapture() {
    const item = this.selectedItemForBattle();
    if (item?.effect === 'capture' && !this.isLeaguePhase()) {
      this.isForcedCapture.set(true);
      this.defeatedOpponent.set(this.opponent());
      this.consumeItem(item.id);
      this.router.navigate(['/cambio']);
    }
  }

  async rerollOpponent() {
    const item = this.selectedItemForBattle();
    if (item?.effect === 'opponent-reroll' && !this.isLeaguePhase()) {
      this.consumeItem(item.id);
      await this.spawnOpponent();
    }
  }

  async rerollStat() {
    const item = this.selectedItemForBattle();
    if (item?.effect === 'reroll-stat') {
      this.consumeItem(item.id);
      this.generateRandomStat();
    }
  }
  async resolveBattle(playerIndex: number): Promise<boolean> {
    const playerPokemon = this.effectiveTeam()[playerIndex];
    const rival = this.effectiveOpponent();
    const statId = this.selectedStatId();
    if (!playerPokemon || !rival || !statId) return false;

    // Solo procesamos objetos que tienen efecto real en el cálculo de combate
    const item = this.selectedItemForBattle();
    const isCombatItem = item && !['instant-win', 'tier-boost', 'opponent-reroll', 'capture', 'revive-all', 'revive-one', 'reroll-stat'].includes(item.effect);

    const playerStatValue = playerPokemon.stats.find(s => s.name === statId)?.value || 0;
    const rivalStatValue = rival.stats.find(s => s.name === statId)?.value || 0;

    // Calcular ventaja/desventaja de tipo
    const multiplier = getMaxTypeEffectiveness(playerPokemon.types, rival.types);
    let bonus = 1;
    
    if (multiplier >= 4) bonus = 1.30;
    else if (multiplier >= 2) bonus = 1.15;
    else if (multiplier <= 0) bonus = 0; 
    else if (multiplier <= 0.25) bonus = 0.70; 
    else if (multiplier <= 0.5) bonus = 0.85; 

    // Aplicar efectos de objeto de combate
    let itemMultiplier = 1;
    let effectiveRivalStat = rivalStatValue;

    if (isCombatItem) {
      if (item.effect === 'stat-boost-50') itemMultiplier = 1.5;
      if (item.effect === 'stat-boost-100') itemMultiplier = 2.0;
      if (item.effect === 'opponent-nerf') effectiveRivalStat *= 0.7;
    }

    const effectivePlayerStat = playerStatValue * bonus * itemMultiplier;
    const winsMatch = effectivePlayerStat >= effectiveRivalStat;

    if (winsMatch) {
      if (isCombatItem && item.effect === 'capture') {
        this.captureOpponent(playerIndex);
      }
      if (isCombatItem) this.consumeItem(item.id);
      await this.winBattle();
      return true;
    } else {
      // Efecto Shield
      if (isCombatItem && item.effect === 'shield') {
        this.consumeItem(item.id);
        return false; 
      }

      if (isCombatItem) this.consumeItem(item.id);
      this.isTierBoostActive.set(false);
      
      // Debilitar al Pokémon original en el índice correspondiente
      this.team.update(t => {
        const newTeam = [...t];
        if (newTeam[playerIndex]) {
          newTeam[playerIndex] = { ...newTeam[playerIndex]!, isFainted: true };
        }
        return newTeam;
      });

      if (!this.isGameOver()) {
        await this.spawnOpponent();
      }
      return false;
    }
  }

  async winBattle() {
    this.isTierBoostActive.set(false);
    const winIncrement = 1; 
    
    this.victories.update(v => v + winIncrement);
    this.totalVictories.update(v => v + winIncrement);
    this.storageService.saveHighScore(this.totalVictories());

    if (this.totalVictories() >= 30) {
      await this.startLeague();
    } else {
      this.defeatedOpponent.set(this.opponent());
      this.router.navigate(['/cambio']);
    }
  }

  async startLeague() {
    this.isLeaguePhase.set(true);
    this.leagueWins.set(0);
    // Curamos al equipo para la liga de forma inmediata
    this.team.update(t => t.map(p => p ? { ...p, isFainted: false } : null));
    
    // Primero mostramos el anuncio y navegamos para dar feedback inmediato
    this.showLeagueAnnouncement.set(true);
    this.router.navigate(['/tablero']);
    
    // Cargamos los rivales en segundo plano mientras el usuario ve el popup
    await this.spawnLeagueOpponents();
  }

  async spawnLeagueOpponents() {
    this.loadingLeagueSlots.set([true, true, true]);
    try {
      const enemies: Pokemon[] = [];
      const usedIds = new Set<number>();

      for (let i = 0; i < 3; i++) {
        let p: Pokemon;
        do {
          p = await this.pokemonService.getRandomPokemonByTier(3);
        } while (usedIds.has(p.id) || this.team().some(tp => tp?.id === p.id));
        
        enemies.push({ ...p, isFainted: false });
        usedIds.add(p.id);
        
        // Simular carga progresiva si se quiere, pero aquí cargamos todo
      }
      this.opponentTeam.set(enemies);
      this.generateRandomStat();
    } finally {
      this.loadingLeagueSlots.set([false, false, false]);
    }
  }

  // --- LIGA POKEMON ---

  async resolveLeagueBattle(playerIndex: number, opponentIndex: number) {
    const myMon = this.effectiveTeam()[playerIndex];
    const enemyMon = this.opponentTeam()[opponentIndex];
    const statId = this.selectedStatId();

    if (!myMon || !enemyMon || myMon.isFainted || enemyMon.isFainted) return;

    // Solo procesamos objetos que tienen efecto real en el cálculo de combate
    const item = this.selectedItemForBattle();
    const isCombatItem = item && !['instant-win', 'tier-boost', 'opponent-reroll', 'capture', 'revive-all', 'revive-one', 'reroll-stat'].includes(item.effect);

    const myVal = myMon.stats.find(s => s.name === statId)?.value || 0;
    const enemyVal = enemyMon.stats.find(s => s.name === statId)?.value || 0;

    // Calcular ventaja/desventaja de tipo
    const multiplier = getMaxTypeEffectiveness(myMon.types, enemyMon.types);
    let bonus = 1;
    
    if (multiplier >= 4) bonus = 1.30;
    else if (multiplier >= 2) bonus = 1.15;
    else if (multiplier <= 0) bonus = 0; 
    else if (multiplier <= 0.25) bonus = 0.70; 
    else if (multiplier <= 0.5) bonus = 0.85; 

    // Aplicar efectos de objeto
    let itemMultiplier = 1;
    let effectiveEnemyVal = enemyVal;

    if (isCombatItem) {
      if (item.effect === 'stat-boost-50') itemMultiplier = 1.5;
      if (item.effect === 'stat-boost-100') itemMultiplier = 2.0;
      if (item.effect === 'opponent-nerf') effectiveEnemyVal *= 0.7;
    }

    const effectiveMyVal = myVal * bonus * itemMultiplier;
    const winsMatch = effectiveMyVal >= effectiveEnemyVal;

    if (winsMatch) {
      if (isCombatItem && item.effect === 'capture') {
        this.captureOpponent(playerIndex);
      }
     
      if (isCombatItem) this.consumeItem(item.id);
      this.updateOpponentStatus(opponentIndex, true);
    } else {
      if (isCombatItem && item.effect === 'shield') {
        this.consumeItem(item.id);
        return; 
      }
      
      if (isCombatItem) this.consumeItem(item.id);
      this.isTierBoostActive.set(false);
      
      // Debilitar al Pokémon original en el índice correspondiente
      this.team.update(t => {
        const newTeam = [...t];
        if (newTeam[playerIndex]) {
          newTeam[playerIndex] = { ...newTeam[playerIndex]!, isFainted: true };
        }
        return newTeam;
      });
    }

    this.checkLeagueRoundEnd();
  }

  private checkLeagueRoundEnd() {
    const enemyWiped = this.opponentTeam().every(p => p === null || p.isFainted);
    
    if (enemyWiped) {
      this.leagueWins.update(w => w + 1);
      if (this.leagueWins() < 4) {
        this.spawnLeagueOpponents();
      }
    } else {
      this.generateRandomStat();
    }
  }

  captureOpponent(index: number) {
    const rival = this.opponent() || this.opponentTeam().find(p => !p?.isFainted);
    if (rival) {
      this.team.update(t => {
        const newTeam = [...t];
        newTeam[index] = { ...rival, isFainted: false };
        return newTeam;
      });
    }
  }

  reviveAllPokemon() {
    this.team.update(t => t.map(p => p ? { ...p, isFainted: false } : null));

    const currentItem = this.selectedItemForBattle() ||
      this.items().find(i => i.effect === 'revive-all' && !i.used);

    if (currentItem && currentItem.effect === 'revive-all') {
      this.consumeItem(currentItem.id);
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
    } else {
      // Si el reemplazo es obligatorio, no permitimos que sea null
      if (this.isForcedCapture()) return;
    }
    this.defeatedOpponent.set(null);
    this.isForcedCapture.set(false);
    this.isExchangePhase.set(false);
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

  consumeItem(id: number) {
    this.items.update(items => items.map(it => it.id === id ? { ...it, used: true } : it));
    this.selectedItemForBattle.set(null);
  }

  revivePokemon(index: number) {
    this.team.update(t => {
      const newTeam = [...t];
      if (newTeam[index]) {
        newTeam[index] = { ...newTeam[index]!, isFainted: false };
      }
      return newTeam;
    });
    const currentItem = this.selectedItemForBattle();
    if (currentItem && currentItem.effect === 'revive-one') {
      this.consumeItem(currentItem.id);
    }
  }
}
