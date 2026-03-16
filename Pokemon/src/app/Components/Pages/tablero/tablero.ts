import { Component, inject } from '@angular/core';
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

  seleccionarParaBatalla(index: number) {
    const pokemon = this.miEquipo[index];
    if (pokemon && !pokemon.isFainted && !this.esFaseSeleccion) {
      this.gameService.resolveBattle(pokemon);
    }
  }
}
