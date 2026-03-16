import { Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { GameService } from '../../../Service/Game/game-service';
import { CartaPokemon } from '../../UI/carta-pokemon/carta-pokemon';

@Component({
  selector: 'app-cambio',
  imports: [CartaPokemon, TitleCasePipe],
  templateUrl: './cambio.html',
  styleUrl: './cambio.css',
})
export class Cambio {
  readonly gameService = inject(GameService);

  get pokemonDerrotado() {
    return this.gameService.defeatedOpponent();
  }

  get miEquipo() {
    return this.gameService.team();
  }

  async reemplazar(index: number) {
    await this.gameService.applyReplacement(index);
  }

  async noCambiar() {
    await this.gameService.applyReplacement(null);
  }
}
