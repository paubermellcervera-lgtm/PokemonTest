import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameService } from '../../../Service/Game/game-service';
import { CartaPokemon } from '../../UI/carta-pokemon/carta-pokemon';

@Component({
  selector: 'app-tablero',
  imports: [CartaPokemon, RouterLink],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
})
export class Tablero {
  readonly gameService = inject(GameService);

  // Estados de animación de batalla
  animatingIndex = signal<number | null>(null);
  revealRivalStat = signal<boolean>(false);

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

  get pokemonRival() {
    return this.gameService.opponent();
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

  get estadisticaSeleccionada() {
    return this.gameService.selectedStatId();
  }

  get nombreEstadistica() {
    return this.gameService.selectedStatName();
  }

  async seleccionarParaBatalla(index: number) {
    const pokemon = this.miEquipo[index];
    if (pokemon && !pokemon.isFainted && !this.esFaseSeleccion && this.animatingIndex() === null) {
      this.animatingIndex.set(index);
      await new Promise(resolve => setTimeout(resolve, 600));
      this.revealRivalStat.set(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await this.gameService.resolveBattle(pokemon);
      this.animatingIndex.set(null);
      this.revealRivalStat.set(false);
    }
  }
}
