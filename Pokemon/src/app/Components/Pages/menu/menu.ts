import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../../Service/Game/game-service';
import { StorageService } from '../../../Service/storage-service';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  private router = inject(Router);
  private gameService = inject(GameService);
  private storageService = inject(StorageService);

  readonly highScore = this.storageService.highScore;
  readonly hasSavedGame = computed(() => !!this.storageService.getGameState());
  showHowToPlay = signal(false);

  async iniciarJuego() {
    this.storageService.clearGameState();
    await this.gameService.initGame();
    this.router.navigate(['/tablero']);
  }

  continuarJuego() {
    this.router.navigate(['/tablero']);
  }

  toggleHowToPlay() {
    this.showHowToPlay.update(v => !v);
  }
}
