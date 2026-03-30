import { Component, input, signal, effect } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Pokemon, ALL_STATS } from '../../../Model/Pokemon';
import { getTypeIconUrl, TYPE_COLORS } from '../../../Utils/type-effectiveness';

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
  revealed = input<boolean>(false); 
  multiplier = input<number>(1);

  displayValues = signal<{ [key: string]: number }>({});
  private currentMultiplierValue = 1;

  constructor() {
    effect(() => {
      const isRev = this.revealed();
      const p = this.pokemon();
      const m = this.multiplier();

      if (isRev && p) {
        if (Object.keys(this.displayValues()).length === 0) {
          // Primera animación: de 0 a base stat
          this.animateStats(1);
          this.currentMultiplierValue = 1;
        } else if (m !== this.currentMultiplierValue) {
          // Segunda animación: de base stat a stat con multiplicador
          this.animateStats(m);
          this.currentMultiplierValue = m;
        }
      } else {
        this.displayValues.set({});
        this.currentMultiplierValue = 1;
      }
    });
  }

  getTypeIcon(type: string) {
    return getTypeIconUrl(type);
  }

  getTypeColor(type: string) {
    return TYPE_COLORS[type] || '#777';
  }

  private animateStats(targetMultiplier: number) {
    const p = this.pokemon();
    if (!p) return;
    
    // Si es la primera animación, empezamos desde 0. Si es cambio de multiplicador, desde el valor actual.
    const isFirstRun = Object.keys(this.displayValues()).length === 0;
    
    p.stats.forEach(stat => {
      const startValue = isFirstRun ? 0 : (this.displayValues()[stat.name] || stat.value);
      const endValue = Math.floor(stat.value * targetMultiplier);
      
      if (startValue === endValue) {
        this.displayValues.update(prev => ({ ...prev, [stat.name]: endValue }));
        return;
      }

      let current = startValue;
      const duration = 800; 
      const steps = 15;
      const increment = (endValue - startValue) / steps;
      const intervalTime = duration / steps;

      const timer = setInterval(() => {
        current += increment;
        const reached = increment > 0 ? current >= endValue : current <= endValue;
        if (reached) {
          current = endValue;
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

  getStatShorthand(statName: string): string {
    const stat = ALL_STATS.find(s => s.id === statName || s.name === statName);
    return stat ? (stat as any).shorthand : statName;
  }
}
