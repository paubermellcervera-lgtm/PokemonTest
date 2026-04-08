import { Component, inject, signal, HostListener, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../../Service/storage-service';
import { Pokemon, ALL_STATS } from '../../../Model/Pokemon';
import { PokemonService } from '../../../Service/Pokemon/pokemon-service';
import { getTypeIconUrl, TYPE_COLORS } from '../../../Utils/type-effectiveness';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-salon-fama',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './salon-fama.html',
  styleUrl: './salon-fama.css'
})
export class SalonFama implements AfterViewInit {
  private storageService = inject(StorageService);
  private pokemonService = inject(PokemonService);
  hallOfFame = signal<Pokemon[][]>(this.storageService.getHallOfFame());
  
  currentIndex = signal(0);
  selectedTeam = signal<Pokemon[] | null>(null);
  currentCardIndex = signal<number>(0);
  selectedFamily = signal<Pokemon[] | null>(null);
  currentFamilyIndex = signal<number>(0);
  loadingFamily = signal(false);
  
  itemHeight = 120; // Altura de cada reglón del rodillo
  
  radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 150,
        ticks: { display: false },
        pointLabels: {
          font: { size: 10 },
          color: '#fff'
        },
        grid: { color: 'rgba(255, 255, 255, 0.2)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.2)' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  ngAfterViewInit() {
    // Inicialización si es necesaria
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (this.selectedTeam() || this.hallOfFame().length === 0) return;
    const delta = event.deltaY;
    if (delta > 0) this.nextTeam();
    else this.prevTeam();
  }

  getTranslateZ() {
    const n = this.hallOfFame().length;
    if (n <= 1) return 0;
    return Math.round(this.itemHeight / (2 * Math.tan(Math.PI / n)));
  }

  getRotationX() {
    const n = this.hallOfFame().length;
    if (n === 0) return 0;
    return -this.currentIndex() * (360 / n);
  }

  selectTeam(team: Pokemon[]) {
    this.selectedTeam.set(team);
    this.currentCardIndex.set(0);
  }

  closeDetail() {
    this.selectedTeam.set(null);
  }

  nextTeam() {
    const n = this.hallOfFame().length;
    if (n === 0) return;
    this.currentIndex.update((i: number) => (i + 1) % n);
  }

  prevTeam() {
    const n = this.hallOfFame().length;
    if (n === 0) return;
    this.currentIndex.update((i: number) => (i - 1 + n) % n);
  }

  getItemTransform(i: number): string {
    const n = this.hallOfFame().length;
    if (n === 0) return '';
    const anglePerItem = 360 / n;
    const itemAngle = anglePerItem * i;
    const containerRotation = this.getRotationX();
    const radius = this.getTranslateZ();
    const isActive = i === this.currentIndex();
    
    let transform = `rotateX(${itemAngle}deg) translateZ(${radius}px) rotateX(${-itemAngle - containerRotation}deg)`;
    
    if (isActive) {
      transform += ' scale(1.2)';
    }
    
    return transform;
  }

  isTeamVisible(i: number): boolean {
    const n = this.hallOfFame().length;
    if (n <= 3) return true;
    const current = this.currentIndex();
    const diff = Math.abs(i - current);
    const distance = Math.min(diff, n - diff);
    return distance <= 1;
  }

  nextCard() {
    this.currentCardIndex.update((i: number) => (i + 1) % 3);
  }

  prevCard() {
    this.currentCardIndex.update((i: number) => (i - 1 + 3) % 3);
  }

  async viewEvolutionLine(p: Pokemon) {
    if (!p.evolutionChainId) return;
    this.loadingFamily.set(true);
    try {
      const family = await this.pokemonService.getFamilyByChainId(p.evolutionChainId);
      this.selectedFamily.set(family);
      this.currentFamilyIndex.set(0);
    } finally {
      this.loadingFamily.set(false);
    }
  }

  nextFamilyCard() {
    const family = this.selectedFamily();
    if (!family) return;
    this.currentFamilyIndex.update((i: number) => (i + 1) % family.length);
  }

  prevFamilyCard() {
    const family = this.selectedFamily();
    if (!family) return;
    this.currentFamilyIndex.update((i: number) => (i - 1 + family.length) % family.length);
  }

  closeFamily() {
    this.selectedFamily.set(null);
  }

  getTypeIcon(type: string) {
    return getTypeIconUrl(type);
  }

  getTypeColor(type: string) {
    return TYPE_COLORS[type] || '#777';
  }

  getChartData(pokemon: Pokemon): ChartData<'radar'> {
    return {
      labels: pokemon.stats.map(s => {
        const statInfo = ALL_STATS.find(as => as.id === s.name || as.name === s.name);
        return statInfo ? statInfo.shorthand : s.name.toUpperCase();
      }),
      datasets: [
        {
          data: pokemon.stats.map(s => s.value),
          label: pokemon.name,
          borderColor: '#ffcb05',
          backgroundColor: 'rgba(255, 203, 5, 0.4)',
          pointBackgroundColor: '#2a75bb',
          pointBorderColor: '#fff',
        }
      ]
    };
  }
}
