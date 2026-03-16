import { Component, input } from '@angular/core';
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

  get statsFiltradas() {
    const p = this.pokemon();
    if (!p) return [];
    
    if (this.showOnlyStatId()) {
      return p.stats.filter(s => s.name === this.showOnlyStatId());
    }
    
    return p.stats;
  }
}
