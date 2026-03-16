import { Component, inject, signal } from '@angular/core';
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
  showHowToPlay = signal(false);

  async iniciarJuego() {
    await this.gameService.initGame();
    this.router.navigate(['/tablero']);
  }

  toggleHowToPlay() {
    this.showHowToPlay.update(v => !v);
  }
}
