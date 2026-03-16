import { Component, input, signal, effect } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Pokemon } from '../../../Model/Pokemon';

@Component({
  selector: 'app-carta-pokemon',
  imports: [TitleCasePipe],
  templateUrl: './carta-pokemon.html',
  styleUrl: './carta-pokemon.css',
})
export class CartaPokemon {
  pokemon = input.required<Pokemon | null>();
  hideStats = input<boolean>(false);
  showOnlyStatId = input<string | null>(null);
  isLoading = input<boolean>(false);
  revealed = input<boolean>(false); // Nueva entrada para activar la revelación

  displayValues = signal<{ [key: string]: number }>({});

  constructor() {
    // Efecto para animar el contador cuando se revela
    effect(() => {
      if (this.revealed() && this.pokemon()) {
        this.animateStats();
      } else {
        this.displayValues.set({});
      }
    });
  }

  private animateStats() {
    const stats = this.pokemon()?.stats || [];
    stats.forEach(stat => {
      let current = 0;
      const target = stat.value;
      const duration = 1000; // 1 segundo de animación
      const steps = 20;
      const increment = target / steps;
      const intervalTime = duration / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        this.displayValues.update(prev => ({
          ...prev,
          [stat.name]: Math.floor(current)
        }));
      }, intervalTime);
    });
  }

  get statsFiltradas() {
    const p = this.pokemon();
    if (!p) return [];
    if (this.showOnlyStatId()) {
      return p.stats.filter(s => s.name === this.showOnlyStatId());
    }
    return p.stats;
  }
}
