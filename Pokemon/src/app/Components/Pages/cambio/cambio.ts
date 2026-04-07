import { Component, inject, signal } from '@angular/core';
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
  readonly gameService: GameService = inject(GameService);

  currentSlotIndex = signal(0);

  prevSlot() {
    this.currentSlotIndex.update(i => (i > 0 ? i - 1 : 2));
  }

  nextSlot() {
    this.currentSlotIndex.update(i => (i < 2 ? i + 1 : 0));
  }

  get pokemonDerrotado() {
    return this.gameService.defeatedOpponent();
  }

  get miEquipo() {
    return this.gameService.team();
  }

  get isForcedCapture() {
    return this.gameService.isForcedCapture();
  }

  async reemplazar(index: number) {
    await this.gameService.applyReplacement(index);
  }

  async noCambiar() {
    await this.gameService.applyReplacement(null);
  }
}
