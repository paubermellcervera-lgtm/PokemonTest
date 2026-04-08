import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly HIGH_SCORE_KEY = 'pokemon_high_score';
  private readonly GAME_STATE_KEY = 'pokemon_game_state';
  private readonly HALL_OF_FAME_KEY = 'pokemon_hall_of_fame';
  
  readonly highScore = signal<number>(this.getHighScore());

  private getHighScore(): number {
    const score = localStorage.getItem(this.HIGH_SCORE_KEY);
    return score ? parseInt(score, 10) : 0;
  }

  saveHighScore(score: number) {
    if (score > this.highScore()) {
      localStorage.setItem(this.HIGH_SCORE_KEY, score.toString());
      this.highScore.set(score);
    }
  }

  saveGameState(state: any) {
    localStorage.setItem(this.GAME_STATE_KEY, JSON.stringify(state));
  }

  getGameState(): any | null {
    const state = localStorage.getItem(this.GAME_STATE_KEY);
    return state ? JSON.parse(state) : null;
  }

  clearGameState() {
    localStorage.removeItem(this.GAME_STATE_KEY);
  }

  saveHallOfFame(team: any[]) {
    const hallOfFame = this.getHallOfFame();
    hallOfFame.push(team);
    localStorage.setItem(this.HALL_OF_FAME_KEY, JSON.stringify(hallOfFame));
  }

  getHallOfFame(): any[][] {
    const data = localStorage.getItem(this.HALL_OF_FAME_KEY);
    return data ? JSON.parse(data) : [];
  }
}
