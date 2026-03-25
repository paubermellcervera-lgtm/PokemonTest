import { Component, inject, signal, effect, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { GameService } from '../../../Service/Game/game-service';
import { CartaPokemon } from '../../UI/carta-pokemon/carta-pokemon';
import { getMaxTypeEffectiveness } from '../../../Utils/type-effectiveness';

@Component({
  selector: 'app-tablero',
  imports: [CartaPokemon, RouterLink],
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

  // Estado de selección en Liga
  selectedRivalIndex = signal<number | null>(null);

  // Estados de animación de evolución
  isEvolutionWhite = signal<boolean>(false);
  showEvolvedSprite = signal<boolean>(false);
  evolutionFinished = signal<boolean>(false);

  constructor() {
    // Escuchar cuando empieza la evolución
    effect(() => {
      if (this.gameService.isEvolving()) {
        this.runEvolutionAnimation();
      }
    });
  }

  private async runEvolutionAnimation() {
    this.evolutionFinished.set(false);
    this.isEvolutionWhite.set(true);
    
    // Intercambio intermitente (flashing)
    for (let i = 0; i < 12; i++) {
      this.showEvolvedSprite.update(v => !v);
      await new Promise(resolve => setTimeout(resolve, 300 - (i * 20))); // Se acelera
    }

    // Finalizar: Mostrar evolución y quitar filtro blanco
    this.showEvolvedSprite.set(true);
    this.isEvolutionWhite.set(false);
    this.evolutionFinished.set(true);

    // Esperar un momento para lucir la evolución
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Aplicar cambios reales en el servicio
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

  async volverAlMenu() {
    await this.gameService.initGame();
    this.router.navigate(['/menu']);
  }

  get pokemonRival() {
    return this.gameService.opponent();
  }

  get rivalesLiga() {
    return this.gameService.opponentTeam();
  }

  get miEquipo() {
    return this.gameService.team();
  }

  get equipoEvolucionado() {
    return this.gameService.evolvedTeamPreview();
  }

  get rerolls() {
    return this.gameService.rerolls();
  }

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

  seleccionarRival(index: number) {
    if (!this.esLiga) return;
    const rival = this.rivalesLiga[index];
    if (rival && !rival.isFainted && this.animatingIndex() === null) {
      this.selectedRivalIndex.set(index);
    }
  }

  async seleccionarParaBatalla(index: number) {
    const pokemon = this.miEquipo[index];
    if (!pokemon || pokemon.isFainted || this.esFaseSeleccion || this.animatingIndex() !== null) return;

    if (this.esLiga) {
      const rivalIndex = this.selectedRivalIndex();
      const rival = this.rivalesLiga[rivalIndex!];
      if (rivalIndex === null || !rival) return;

      this.animatingIndex.set(index);
      this.animatingRivalIndex.set(rivalIndex);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      this.revealRivalStat.set(true);
      
      // Mostrar Multiplicador
      this.currentMultiplier.set(getMaxTypeEffectiveness(pokemon.types, rival.types));
      await new Promise(resolve => setTimeout(resolve, 800));
      this.showMultiplier.set(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      await new Promise(resolve => setTimeout(resolve, 600));
      this.revealRivalStat.set(true);

      // Mostrar Multiplicador
      this.currentMultiplier.set(getMaxTypeEffectiveness(pokemon.types, rival.types));
      await new Promise(resolve => setTimeout(resolve, 800));
      this.showMultiplier.set(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      await this.gameService.resolveBattle(pokemon);
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


  currentMultiplierWithBonus = computed(() => {
    const m = this.currentMultiplier();
    if (m >= 4) return 1.30;
    if (m >= 2) return 1.15;
    if (m === 0) return 0;
    if (m <= 0.25) return 0.70;
    if (m <= 0.5) return 0.85;
    return 1;
  });

  Chetos() {
    this.gameService.totalVictories.set(40);
  }

}

