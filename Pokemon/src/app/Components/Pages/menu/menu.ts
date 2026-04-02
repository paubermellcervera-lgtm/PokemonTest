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
  currentSlide = signal(0);

  slides = [
    {
      text: 'Elige tu equipo inicial de 3 Pokémon.',
      image: '/img/Seleccion-Pokemon.png'
    },
    {
      text: 'Usa rerolls para cambiar y mejorar tus opciones.',
      image: '/img/Rerroll.png'
    },
    {
      text: 'Las batallas dependen de stats y tipos.',
      image: '/img/Stat-Seleccionada.png'
    },
    {
      text: 'Usa objetos para curar, revivir o potenciar.',
      image: '/img/Objetos.png'
    },
    {
      text: 'Activa objetos en el momento clave.',
      image: '/img/Objeto-Animacion.png'
    },
    {
      text: 'Gana combates para avanzar.',
      image: '/img/Victorias.png'
    },
    {
      text: 'La dificultad aumenta con el tier.',
      image: '/img/Tier.png'
    }
  ];

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
    this.currentSlide.set(0);
  }

  nextSlide() {
    this.currentSlide.update(v => (v + 1) % this.slides.length);
  }

  prevSlide() {
    this.currentSlide.update(v => (v - 1 + this.slides.length) % this.slides.length);
  }
}
