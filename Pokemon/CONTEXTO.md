# Pokémon Battle Simulator - Contexto del Proyecto

## 📌 Descripción General
Este proyecto es un **Simulador de Batallas Pokémon** desarrollado con **Angular 21**. Es un juego de estilo "rogue-like" o de progresión por turnos donde el jugador forma un equipo de 3 Pokémon y debe superar una serie de combates basados en estadísticas para llegar a la Liga Pokémon y ganar el campeonato.

## 🕹️ Mecánicas de Juego
- **Fase de Selección:** El jugador inicia eligiendo un equipo de 3 Pokémon (Tier 1). Puede usar "Rerolls" individuales para cambiar Pokémon específicos antes de confirmar el equipo.
- **Sistema de Combate:**
  - Los enfrentamientos son 1vs1.
  - Se selecciona una estadística (PS, Atk, Def, etc.) al azar para el duelo.
  - El Pokémon con la estadística más alta gana.
  - Si el jugador gana, puede elegir reemplazar a su Pokémon por el rival derrotado o continuar.
- **Progresión y Evolución:**
  - **Tiers:** El juego progresa a través de Tiers (1, 2 y 3).
  - **Evolución:** Tras acumular 10 victorias en un Tier, el equipo evoluciona a su siguiente etapa (consultando la PokeAPI).
  - **La Liga:** Tras 30 victorias totales, se accede a la fase final donde se deben ganar 4 combates de liga contra equipos completos de Tier 3.
- **Objetos:** Existen diversos ítems (Master Ball, Revivir, Boosts de stats, etc.) que alteran el flujo del combate.

## 🛠️ Stack Tecnológico
- **Framework:** Angular 21.
- **Estado Global:** Uso intensivo de **Angular Signals** para una reactividad eficiente.
- **API:** Integración con **PokeAPI** para obtener datos, sprites y cadenas evolutivas en tiempo real.
- **Persistencia:** `LocalStorage` gestionado por un servicio dedicado para guardar el progreso de la partida.
- **Estilo:** CSS Vanilla con estética **Pixel Art**, botones con efecto 3D y animaciones personalizadas (`glow`, `pulse`, `pixelated`).

## 🎨 Identidad Visual y UI
- **Estética:** Retro/Game-boy style (Pixel Art).
- **Componentes Clave:**
  - `Tablero`: Orquestador visual del combate y evolución.
  - `Carta-Pokemon`: Visualización dinámica de estadísticas con animaciones de conteo.
- **Diseño de Interacción (CAMBIO.md):** Implementación de "Pestañas de Acción" ancladas a las cartas de los Pokémon para acciones como el *Reroll*, evitando saturar el fondo del juego y mejorando la ergonomía en móviles.

## 📂 Estructura de Archivos Relevantes
- `src/app/Service/Game/game-service.ts`: Lógica principal y estado del juego.
- `src/app/Service/Pokemon/pokemon-service.ts`: Comunicación con PokeAPI.
- `src/app/Components/Pages/tablero/`: Pantalla principal de juego.
- `src/app/Model/`: Definiciones de interfaces para `Pokemon` e `Item`.
