import { Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { GameService } from '../../../Service/Game/game-service';
import { CartaPokemon } from '../../UI/carta-pokemon/carta-pokemon';
import { getMaxTypeEffectiveness } from '../../../Utils/type-effectiveness';
import { Item } from '../../../Model/Item';

@Component({
  selector: 'app-tablero',
  imports: [CartaPokemon, RouterLink,],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
})
export class Tablero {
  readonly gameService = inject(GameService);
  private router = inject(Router);

  // Estados de animación de batalla
  animatingIndex = signal<number | null>(null);
  animatingRivalIndex = signal<number | null>(null);
  revealRivalStat = signal<boolean>(false);
  showMultiplier = signal<boolean>(false);
  currentMultiplier = signal<number>(1);

  // Estados de Objetos
  animatingItem = signal<Item | null>(null);
  isReviveMode = signal<boolean>(false);

  // Estado de selección en Liga
  selectedRivalIndex = signal<number | null>(null);

  // Estados de animación de evolución
  isEvolutionWhite = signal<boolean>(false);
  showEvolvedSprite = signal<boolean>(false);
  evolutionFinished = signal<boolean>(false);

  // Detección de estilo móvil
  isMobileStyle = signal<boolean>(window.matchMedia('(max-width: 768px)').matches);
  private mobileMediaQuery = window.matchMedia('(max-width: 768px)');

  constructor() {
    // Escuchar cuando empieza la evolución
    effect(() => {
      if (this.gameService.isEvolving()) {
        this.runEvolutionAnimation();
      }
    });

    // Actualizar estado cuando el tamaño cambia
    const onChange = (event: MediaQueryListEvent) => {
      this.isMobileStyle.set(event.matches);
    };

    if (this.mobileMediaQuery.addEventListener) {
      this.mobileMediaQuery.addEventListener('change', onChange);
    } else {
      this.mobileMediaQuery.addListener(onChange);
    }
  }

  private async runEvolutionAnimation() {
    this.evolutionFinished.set(false);
    this.showEvolvedSprite.set(false);
    this.isEvolutionWhite.set(true);

    // Animación de parpadeo alterno (Fiel a la original)
    // Alterna entre la silueta del pokemon actual y la evolución
    let delay = 400;
    const minDelay = 60;
    const iterations = 25;

    for (let i = 0; i < iterations; i++) {
      this.showEvolvedSprite.update(v => !v);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Acelerar el parpadeo gradualmente
      if (delay > minDelay) {
        delay -= (delay * 0.15);
      }
    }

    // Revelación final
    this.isEvolutionWhite.set(false);
    this.showEvolvedSprite.set(true);
    this.evolutionFinished.set(true);

    // Esperar para ver el resultado
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Aplicar cambios al servicio
    this.gameService.completeEvolution();
    this.evolutionFinished.set(false);
    this.showEvolvedSprite.set(false);
  }

  async reroll(index: number) {
    await this.gameService.generatePokemonForSlot(index);
  }

  async confirmarEquipo() {
    await this.gameService.confirmTeam();
  }

  async activarObjeto(item: Item) {
    if (item.used || this.animatingItem() || this.animatingIndex() !== null) return;
    
    const estaSeleccionado = this.gameService.selectedItemForBattle()?.id === item.id;

    // Si ya está seleccionado, deseleccionar
    if (estaSeleccionado) {
      this.gameService.selectedItemForBattle.set(null);
      this.isReviveMode.set(false);
      return;
    }

    // Reproducir animación siempre al seleccionar (de primeras)
    await this.ejecutarAnimacionObjeto(item);

    // Seleccionar el objeto
    this.isReviveMode.set(false);
    this.gameService.useItem(item);
  }

  cancelarObjeto() {
    this.gameService.selectedItemForBattle.set(null);
    this.isReviveMode.set(false);
  }

  async usarObjetoDirecto(event: Event, item: Item) {
    event.stopPropagation();
    if (item.used || this.animatingIndex() !== null || this.animatingItem()) return;

    // Validación: Comprobar si hay algún pokemon derrotado para los objetos de revivir
    if (item.effect === 'revive-all' || item.effect === 'revive-one') {
      const hasFainted = this.gameService.team().some(p => p && p.isFainted);
      if (!hasFainted) {
        alert('¡No tienes ningún Pokémon derrotado que revivir!');
        return;
      }
    }

    // Aplicar el efecto directamente (la animación ya se reprodujo al seleccionar)
    if (item.effect === 'instant-win') {
      await this.gameService.applyInstantWin();
    } else if (item.effect === 'tier-boost') {
      await this.gameService.applyTierBoost();
    } else if (item.effect === 'opponent-reroll') {
      await this.gameService.rerollOpponent();
    } else if (item.effect === 'capture') {
      await this.gameService.applyForceCapture();
    } else if (item.effect === 'revive-all') {
      await this.gameService.reviveAllPokemon();
    } else if (item.effect === 'revive-one') {
      this.isReviveMode.set(true);
    } else if (item.effect === 'reroll-stat') {
      await this.gameService.rerollStat();
    }
  }

  private async ejecutarAnimacionObjeto(item: Item) {
    this.animatingItem.set(item);
    await new Promise(resolve => setTimeout(resolve, 2500));
    this.animatingItem.set(null);
  }

  esObjetoInmediato(item: Item): boolean {
    return ['instant-win', 'tier-boost', 'opponent-reroll', 'capture', 'revive-all', 'revive-one', 'reroll-stat'].includes(item.effect);
  }

  esEstiloMovil(): boolean {
    return this.isMobileStyle();
  }

  async volverAlMenu() {
    await this.gameService.initGame();
    this.router.navigate(['/menu']);
  }

  closeLeagueAnnouncement() {
    this.gameService.showLeagueAnnouncement.set(false);
  }

  get pokemonRival() {
    return this.gameService.effectiveOpponent();
  }

  get rivalesLiga() {
    return this.gameService.opponentTeam();
  }

  get miEquipo() {
    return this.gameService.effectiveTeam();
  }

  get equipoEvolucionado() {
    return this.gameService.evolvedTeamPreview();
  }

  get rerolls() {
    return this.gameService.rerolls();
  }

  leaderIndex = computed(() => {
    const team = this.gameService.team();
    return team.findIndex(p => p && !p.isFainted);
  });

  get esFaseSeleccion() {
    return this.gameService.isSelectionPhase();
  }

  get esLiga() {
    return this.gameService.isLeaguePhase();
  }

  get estadisticaSeleccionada() {
    return this.gameService.selectedStatId();
  }

  get nombreEstadistica() {
    return this.gameService.selectedStatName();
  }

  getActionText(index: number): string | null {
    const pokemon = this.miEquipo[index];
    if (this.esFaseSeleccion) {
      return this.rerolls[index] === 3 ? 'ELEGIR' : null;
    }
    if (this.isReviveMode()) {
      return pokemon?.isFainted ? 'REVIVIR' : null;
    }
    if (pokemon && !pokemon.isFainted) {
      if (this.esLiga && this.selectedRivalIndex() === null) return null;
      return 'LUCHAR';
    }
    return null;
  }

  seleccionarRival(index: number) {
    if (!this.esLiga) return;
    const rival = this.rivalesLiga[index];
    if (rival && !rival.isFainted && this.animatingIndex() === null) {
      this.selectedRivalIndex.set(index);
    }
  }

  async seleccionarParaBatalla(index: number) {
    const pokemon = this.miEquipo[index];
    if (!pokemon || this.esFaseSeleccion || this.animatingIndex() !== null) return;

    // Manejar Revivir
    if (this.isReviveMode()) {
      if (pokemon.isFainted) {
        this.gameService.revivePokemon(index);
        this.isReviveMode.set(false);
      }
      return;
    }

    if (pokemon.isFainted) return;

    if (this.esLiga) {
      const rivalIndex = this.selectedRivalIndex();
      const rival = this.rivalesLiga[rivalIndex!];
      if (rivalIndex === null || !rival) return;

      this.animatingIndex.set(index);
      this.animatingRivalIndex.set(rivalIndex);
      
      // Wait for clash animation (0.6s) + impact/shake (0.2s)
      await new Promise(resolve => setTimeout(resolve, 800));
      this.revealRivalStat.set(true);
      
      // Mostrar Multiplicador with a slight delay after revealing stats
      this.currentMultiplier.set(getMaxTypeEffectiveness(pokemon.types, rival.types));
      await new Promise(resolve => setTimeout(resolve, 600));
      this.showMultiplier.set(true);
      
      // Let the multiplier pop and the moment linger
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      await this.gameService.resolveLeagueBattle(index, rivalIndex);
      
      this.animatingIndex.set(null);
      this.animatingRivalIndex.set(null);
      this.revealRivalStat.set(false);
      this.showMultiplier.set(false);
      this.selectedRivalIndex.set(null);
    } else {
      // Combate Normal
      const rival = this.pokemonRival;
      if (!rival) return;

      this.animatingIndex.set(index);
      
      // Wait for clash animation (0.6s) + impact/shake (0.2s)
      await new Promise(resolve => setTimeout(resolve, 800));
      this.revealRivalStat.set(true);

      // Mostrar Multiplicador with a slight delay
      this.currentMultiplier.set(getMaxTypeEffectiveness(pokemon.types, rival.types));
      await new Promise(resolve => setTimeout(resolve, 600));
      this.showMultiplier.set(true);
      
      // Let the moment linger
      await new Promise(resolve => setTimeout(resolve, 1800));

      await this.gameService.resolveBattle(index);
      this.animatingIndex.set(null);
      this.revealRivalStat.set(false);
      this.showMultiplier.set(false);
    }
  }

  getMultiplierText() {
    const m = this.currentMultiplier();
    if (m >= 4) return '¡VENTAJA x4! (+30%)';
    if (m >= 2) return '¡VENTAJA x2! (+15%)';
    if (m === 0) return '¡INMUNE! (-100%)';
    if (m <= 0.25) return '¡DESVENTAJA x4! (-30%)';
    if (m <= 0.5) return '¡DESVENTAJA x2! (-15%)';
    return '';
  }

  hasBoost(item: Item | null): boolean {
    return !!item;
  }

  getBoostType(item: Item | null): string {
    if (!item) return '';
    const effect = item.effect;
    switch (effect) {
      case 'instant-win': return 'boost-win';
      case 'capture': return 'boost-capture';
      case 'stat-boost-50': return 'boost-med';
      case 'stat-boost-100': return 'boost-high';
      case 'shield': return 'boost-shield';
      case 'revive-all': return 'boost-revive-all';
      case 'tier-boost': return 'boost-tier';
      case 'opponent-reroll': return 'boost-priority';
      case 'reroll-stat': return 'boost-reroll-stat';
      case 'revive-one': return 'boost-revive';
      case 'opponent-nerf': return 'boost-med';
      default: return '';
    }
  }

  getBoostText(item: Item | null): string {
    if (!item) return '';
    const effect = item.effect;
    switch (effect) {
      case 'instant-win': return 'VICTORIA';
      case 'capture': return 'CAPTURAR';
      case 'stat-boost-50': return '+50% EST.';
      case 'stat-boost-100': return '+100% EST.';
      case 'shield': return 'ESCUDO';
      case 'revive-all': return 'EQUIPO';
      case 'tier-boost': return 'TIER MAX';
      case 'opponent-reroll': return 'REROLL';
      case 'reroll-stat': return 'REROLL STAT';
      case 'revive-one': return 'REVIVIR';
      case 'opponent-nerf': return '-30% RIVAL';
      default: return '';
    }
  }


  currentMultiplierWithBonus = computed(() => {
    const m = this.currentMultiplier();
    let bonus = 1;
    if (m >= 4) bonus = 1.30;
    else if (m >= 2) bonus = 1.15;
    else if (m === 0) bonus = 0;
    else if (m <= 0.25) bonus = 0.70;
    else if (m <= 0.5) bonus = 0.85;

    // Incluir bonus de objeto
    const item = this.gameService.selectedItemForBattle();
    if (item) {
      if (item.effect === 'stat-boost-50') bonus *= 1.5;
      if (item.effect === 'stat-boost-100') bonus *= 2.0;
      if (item.effect === 'tier-boost') bonus *= 1.4;
      if (item.effect === 'opponent-nerf') bonus *= 1.43;
      if (item.effect === 'instant-win') bonus = 999; 
    }

    return bonus;
  });

  Chetos() {
    this.gameService.totalVictories.set(40);
  }
  Chetos2() {
    this.gameService.leagueWins.set(4);
  }
  Aegislash() {
    this.gameService.team.set([
      { id: 681, name: 'Aegislash', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/681.png', tier: 3, types: ['steel', 'ghost'], stats: [], weight: 53, isFainted: false, evolutionChainId: 0 },
      null,
      null
    ]);
}
}