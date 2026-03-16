import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly HIGH_SCORE_KEY = 'pokemon_high_score';
  
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
}
