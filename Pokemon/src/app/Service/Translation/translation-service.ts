import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from '../storage-service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private storageService = inject(StorageService);
  private currentLang = signal<'es' | 'en'>(
    (localStorage.getItem('lang') as 'es' | 'en') || 'es'
  );
  
  private translations: Record<'es' | 'en', any> = {
    es: {
      MENU: { 
        TITLE: 'Juego Pokémon', 
        START: 'Iniciar Juego',
        CONTINUE: 'Continuar',
        NEW_GAME: 'Nueva Partida',
        HOW_TO_PLAY: '¿Cómo jugar?',
        HALL_OF_FAME: 'Salón de la Fama'
      },
      TABLERO: {
        TITLE: 'Combate Pokémon',
        ACTION: 'Realizar acción',
        VICTORY: '¡Victoria!',
        DEFEAT: '¡Derrota!',
        EVOLUTION: '¡EVOLUCIÓN!',
        EVOLUTION_PROGRESS: 'Evolución',
        SELECT_RIVAL: 'Selecciona un rival',
        CHOOSE_POKEMON: '¡Elige a tu Pokémon!',
        REVIVE_PROMPT: 'Selecciona un Pokémon debilitado para reanimarlo',
        WINS_SHORT: 'VIC',
        WINS_LONG: 'VICTORIAS',
        PREPARE_TEAM: 'PREPARA TU EQUIPO',
        YOUR_TEAM: 'Tu Equipo',
        CONFIRM_TEAM: '¡CONFIRMAR EQUIPO!',
        DEFEAT_MODAL: '¡DERROTA!',
        VICTORIES_ACHIEVED: 'Has conseguido',
        VICTORIES_COUNT: 'victorias.',
        BACK_TO_START: 'Volver al Inicio',
        CHAMPION: '🎉 ¡NUEVO CAMPEÓN! 🎉',
        LEAGUE_VICTORY: 'Has superado la Liga Pokémon con honor.',
        BACK_TO_MENU: 'Volver al Menú Principal',
        LEAGUE_ARRIVAL: '¡HAS LLEGADO A LA LIGA POKÉMON!',
        TEAM_HEALED: 'Tu equipo ha sido curado por completo.',
        FINAL_CHALLENGE: 'Prepárate para el desafío final.',
        START_LEAGUE: '¡EMPEZAR!',
        STATS: { 'HP': 'PS', 'Ataque': 'ATQ', 'Defensa': 'DEF', 'At. Especial': 'ATQ. ESP', 'Def. Especial': 'DEF. ESP', 'Velocidad': 'VEL' },
        BOOSTS: { VICTORY: 'VICTORIA', CAPTURE: 'CAPTURAR', SHIELD: 'ESCUDO', TEAM: 'EQUIPO', TIER_MAX: 'TIER MAX', REROLL: 'REROLL', REROLL_STAT: 'REROLL STAT', REVIVE: 'REVIVIR', NERF: '-30% RIVAL', ACTIVE: 'ACTIVO', READY: 'LISTO', USE: '¡USAR!', CANCEL: 'CANCELAR' }
      },
      LIGA_POKEMON: {
        OPPONENT_LEAGUE: 'Alto Mando',
        OPPONENT_NORMAL: 'Oponente'
      },
      ITEMS: {
        'Master Ball': 'Master Ball',
        'Ultra Ball': 'Ultra Ball',
        'X-Attack': 'X-Ataque',
        'Choice Band': 'Cinta Especial',
        'Focus Band': 'Cinta Focal',
        'Max Revive': 'Max Poción',
        'Rare Candy': 'Caramelo Raro',
        'Escape Rope': 'Cuerda de Escape',
        'Revive': 'Revivir'
      },
      ITEM_DESCRIPTIONS: {
        'instant-win': 'Gana el combate automáticamente (Efecto Master Ball).',
        'capture': 'Captura al oponente actual inmediatamente y te obliga a cambiarlo por uno de tu equipo.',
        'stat-boost-50': '+50% a la estadística de combate actual.',
        'stat-boost-100': '+100% a la estadística de combate actual.',
        'shield': 'Protege de la derrota: Si pierdes, el Pokémon no se debilita.',
        'reroll-stat': 'Rerollea la estadística seleccionada para el combate.',
        'revive-all': 'Revive a TODOS los Pokémon debilitados del equipo.',
        'tier-boost': 'Tu equipo evoluciona al Tier 3 temporalmente para este combate.',
        'opponent-reroll': 'Cambia al oponente actual por otro aleatorio (No funciona en la Liga).',
        'opponent-nerf': 'Reduce la estadística del rival en un 30%.',
        'revive-one': 'Revive a un Pokémon seleccionado del equipo.'
      }
    },
    en: {
      MENU: { 
        TITLE: 'Pokémon Game', 
        START: 'Start Game',
        CONTINUE: 'Continue',
        NEW_GAME: 'New Game',
        HOW_TO_PLAY: 'How to play?',
        HALL_OF_FAME: 'Hall of Fame'
      },
      TABLERO: {
        TITLE: 'Pokémon Battle',
        ACTION: 'Perform action',
        VICTORY: 'Victory!',
        DEFEAT: 'Defeat!',
        EVOLUTION: 'EVOLUTION!',
        EVOLUTION_PROGRESS: 'Evolution',
        SELECT_RIVAL: 'Select a rival',
        CHOOSE_POKEMON: 'Choose your Pokémon!',
        REVIVE_PROMPT: 'Select a fainted Pokémon to revive',
        WINS_SHORT: 'WINS',
        WINS_LONG: 'WINS',
        PREPARE_TEAM: 'PREPARE YOUR TEAM',
        YOUR_TEAM: 'Your Team',
        CONFIRM_TEAM: 'CONFIRM TEAM!',
        DEFEAT_MODAL: 'DEFEAT!',
        VICTORIES_ACHIEVED: 'You achieved',
        VICTORIES_COUNT: 'victories.',
        BACK_TO_START: 'Back to Start',
        CHAMPION: '🎉 NEW CHAMPION! 🎉',
        LEAGUE_VICTORY: 'You have overcome the Pokémon League with honor.',
        BACK_TO_MENU: 'Back to Main Menu',
        LEAGUE_ARRIVAL: 'YOU HAVE REACHED THE POKÉMON LEAGUE!',
        TEAM_HEALED: 'Your team has been fully healed.',
        FINAL_CHALLENGE: 'Prepare yourself for the final challenge.',
        START_LEAGUE: 'LET\'S START!',
        STATS: { 'HP': 'HP', 'Ataque': 'ATK', 'Defensa': 'DEF', 'At. Especial': 'SPA', 'Def. Especial': 'SPD', 'Velocidad': 'SPE' },
        BOOSTS: { VICTORY: 'VICTORY', CAPTURE: 'CAPTURE', SHIELD: 'SHIELD', TEAM: 'TEAM', TIER_MAX: 'TIER MAX', REROLL: 'REROLL', REROLL_STAT: 'REROLL STAT', REVIVE: 'REVIVE', NERF: '-30% RIVAL', ACTIVE: 'ACTIVE', READY: 'READY', USE: 'USE!', CANCEL: 'CANCEL' }
      },
      LIGA_POKEMON: {
        OPPONENT_LEAGUE: 'Elite Four',
        OPPONENT_NORMAL: 'Opponent'
      },
      ITEMS: {
        'Master Ball': 'Master Ball',
        'Ultra Ball': 'Ultra Ball',
        'X-Attack': 'X-Attack',
        'Choice Band': 'Choice Band',
        'Focus Band': 'Focus Band',
        'Max Revive': 'Max Revive',
        'Rare Candy': 'Rare Candy',
        'Escape Rope': 'Escape Rope',
        'Revive': 'Revive'
      },
      ITEM_DESCRIPTIONS: {
        'instant-win': 'Win the battle automatically (Master Ball Effect).',
        'capture': 'Capture the current opponent immediately and force you to swap it with one of your team.',
        'stat-boost-50': '+50% to the current battle stat.',
        'stat-boost-100': '+100% to the current battle stat.',
        'shield': 'Protects from defeat: If you lose, the Pokémon does not faint.',
        'reroll-stat': 'Reroll the stat selected for the battle.',
        'revive-all': 'Revive ALL fainted Pokémon on your team.',
        'tier-boost': 'Your team evolves to Tier 3 temporarily for this battle.',
        'opponent-reroll': 'Change the current opponent for another random one (Doesn\'t work in League).',
        'opponent-nerf': 'Reduces the opponent\'s stat by 30%.',
        'revive-one': 'Revive a Pokémon of your choice from your team.'
      }
    }
  };

  public lang = this.currentLang.asReadonly();

  setLang(lang: 'es' | 'en') {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
  }

  translate(key: string): string {
    // Normalizamos la clave: si contiene espacios o puntos dentro del nombre de la estadística,
    // debemos acceder de forma segura al objeto.
    const parts = key.split('.');
    let value = this.translations[this.currentLang()];
    
    // Si la clave tiene más de 2 partes (ej: TABLERO.STATS.Def. Especial), 
    // las partes finales son el nombre de la estadística.
    if (parts.length > 3) {
      const statName = parts.slice(2).join('.');
      value = value[parts[0]][parts[1]][statName];
    } else {
      for (const k of parts) {
        value = value ? value[k] : null;
      }
    }
    
    // Si no encontramos el valor, intentamos buscar en la sección ITEMS
    if (!value && !key.includes('.')) {
      const itemsSection = this.translations[this.currentLang()]['ITEMS'];
      if (itemsSection && itemsSection[key]) {
        return itemsSection[key];
      }
    }
    
    return value || key;
  }
}
