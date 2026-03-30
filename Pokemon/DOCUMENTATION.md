# Documentación Detallada: Pokémon Battle Simulator

Este documento profundiza en la lógica interna del proyecto, explicando cada servicio, sus métodos y el flujo de datos entre componentes.

---

## 🛠️ Servicios y Lógica de Negocio

### 1. GameService (`game-service.ts`)
Es el orquestador del estado global del juego utilizando **Angular Signals**.

#### **Estado (Signals)**
- `team`: Array de 3 Pokémon (o `null`) que forman el equipo del jugador.
- `opponent`: El Pokémon rival actual en batallas 1vs1.
- `defeatedOpponent`: Almacena temporalmente al rival derrotado para la fase de cambio.
- `victories`: Contador de victorias en el Tier actual.
- `totalVictories`: Contador acumulado para la progresión a la Liga.
- `currentTier`: Nivel actual de evolución (1, 2 o 3).
- `selectedStatId`: ID de la estadística elegida aleatoriamente para el combate actual.
- `rerolls`: Array que indica cuántos cambios quedan para cada slot del equipo inicial.
- `isRerollGlobalCooldown`: Signal booleano que impide realizar múltiples rerolls en menos de 1 segundo para evitar spam y asegurar la carga correcta de datos.
- `isSelectionPhase`: Booleano que indica si el jugador está en la pantalla de inicio eligiendo equipo.
- `isLeaguePhase`: Indica si el jugador ha entrado en la fase final de la Liga.
- `leagueWins`: Contador de victorias dentro de la Liga (se requieren 4 para ganar el juego).

#### **Métodos Detallados**
- `initGame()`: Reinicia todos los signals a sus valores por defecto y limpia el `LocalStorage`.
- `generatePokemonForSlot(index)`: Genera un Pokémon aleatorio del Tier actual para un slot específico, gastando un *reroll*. Evita duplicados en el equipo.
- `confirmTeam()`: Valida que el equipo esté completo y cambia la fase de selección a la fase de combate, spawneando al primer oponente.
- `spawnOpponent()`: Obtiene un Pokémon aleatorio del Tier actual (distinto a los del equipo del jugador) y selecciona una estadística aleatoria para el duelo.
- `resolveBattle(playerPokemon)`: Compara la estadística seleccionada entre el Pokémon del jugador y el rival. Si el jugador gana, llama a `winBattle()`; si pierde, marca al Pokémon como debilitado (`isFainted`).
- `winBattle()`: Incrementa los contadores de victorias. Si llega a 40 totales, inicia la Liga; de lo contrario, guarda al rival derrotado y navega a la pantalla de cambio.
- `applyReplacement(index)`: Si el jugador elige un slot (0-2), reemplaza al Pokémon de ese slot por el oponente derrotado (curado). Si es `null`, no hay cambio. Luego verifica si toca evolucionar.
- `prepareEvolution()`: Calcula las evoluciones de los 3 Pokémon del equipo consultando la PokeAPI. Si un Pokémon no tiene evolución o ya fue usada, sube sus stats base al siguiente Tier.
- `completeEvolution()`: Aplica formalmente el equipo evolucionado, incrementa el `currentTier` y reinicia las victorias del Tier.
- `startLeague()`: Cura a todo el equipo del jugador y genera el primer equipo rival de la Liga (Tier 3).
- `resolveLeagueBattle(playerIdx, opponentIdx)`: Resuelve un duelo específico dentro de la Liga. Si el equipo rival es derrotado por completo, genera uno nuevo o finaliza el juego si se alcanzan las 4 victorias de Liga.

---

### 2. PokemonService (`pokemon-service.ts`)
Gestiona la comunicación asíncrona con la PokeAPI.

#### **Métodos Detallados**
- `getPokemonById(id, tier)`: 
  - Consulta `/pokemon/{id}` para stats y sprites.
  - Consulta `/pokemon-species/{id}` para obtener la URL de la cadena evolutiva.
  - Retorna un objeto `Pokemon` formateado para la aplicación.
- `getRandom3StageFamily()`: 
  - Algoritmo de búsqueda que selecciona un `evolution-chain` al azar.
  - Filtra aquellas cadenas que tengan exactamente 3 etapas evolutivas para asegurar una progresión coherente (ej: Charmander -> Charmeleon -> Charizard).
- `getRandomPokemonByTier(tier)`: Utiliza `getRandom3StageFamily` para obtener un ID correspondiente al Tier solicitado (etapa 1, 2 o 3 de la familia).
- `getNextEvolution(chainId, currentName, currentTier)`: 
  - Recorre la cadena evolutiva desde la raíz.
  - Localiza el nombre del Pokémon actual y busca su sucesor inmediato.
  - Retorna el objeto `Pokemon` de la evolución.

---

### 4. StorageService (`storage-service.ts`)
Maneja la persistencia local para evitar la pérdida de progreso al recargar.

#### **Métodos Detallados**
- `saveHighScore(score)`: Compara el score actual con el guardado en `pokemon_high_score` y lo actualiza si es mayor.
- `saveGameState(state)`: Guarda un objeto JSON con todos los signals relevantes del `GameService` en `pokemon_game_state`.
- `getGameState()`: Recupera y parsea el estado guardado.
- `clearGameState()`: Elimina los datos de la partida actual (usado al perder o ganar).

---

## 🎒 Sistema de Objetos (Items)

El juego cuenta con un sistema de inventario que permite al jugador utilizar objetos estratégicos para cambiar el rumbo de los combates.

### **1. Obtención de Objetos**
Al inicio de cada partida (`initGame`), el `PokemonService` consulta la PokeAPI para obtener **3 objetos aleatorios**. Estos objetos se mapean internamente a efectos específicos definidos en `Item.ts`.

### **2. Ciclo de Vida de un Objeto**
- **Carga:** Se almacenan en el Signal `items` y se persisten en `LocalStorage`.
- **Selección:** El jugador elige un objeto en el `Tablero`. Este se marca como `selectedItemForBattle`.
- **Uso:** El efecto se activa durante la resolución del combate (`resolveBattle` o `resolveLeagueBattle`).
- **Consumo:** Tras aplicarse el efecto, el objeto se marca como `used: true` mediante `consumeItem()`, quedando inhabilitado para el resto de la partida.

### **3. Tipos de Efectos Disponibles**

| Efecto | Descripción Técnica |
| :--- | :--- |
| **Instant Win** (Master Ball) | Salta la comparación de stats y otorga la victoria inmediata. |
| **Stat Boost (50%/100%)** | Multiplica el stat del jugador por 1.5 o 2.0 respectivamente. |
| **Opponent Nerf** | Reduce el stat del rival en un 30% (multiplicador 0.7). |
| **Shield** | Si el jugador pierde, el Pokémon **no se debilita** y el combate se repite con un nuevo rival. |
| **Capture** | Si el jugador gana, el Pokémon rival se une al equipo reemplazando al actual. |
| **Double Win** | Otorga 2 victorias en lugar de 1. En la Liga, derrota a un rival adicional al azar. |
| **Tie Breaker** | Otorga la victoria si el stat del jugador es al menos el 90% del stat del rival. |
| **Tier Boost** | Simula que el Pokémon es de Tier 3 (multiplicador 1.4) solo para ese combate. |
| **Revive (One/All)** | Restaura el estado `isFainted: false` de uno o todos los Pokémon del equipo. |

---

## 🎨 Diseño Visual y CSS

La aplicación utiliza un enfoque de **CSS Vanilla** con un diseño responsivo y orientado a la experiencia de juego ("Game Feel").

### **1. Sistema de Botones 3D**
Ubicado en `styles.css`, implementa un sistema de botones con profundidad visual:
- **Efecto de Presión:** Al hacer clic, el botón se desplaza físicamente (`translateY(3px)`) y su sombra se reduce, simulando un botón real.
- **Código de Colores:** 
  - Amarillo (`.btn-primary`): Acciones principales.
  - Verde (`.btn-success`): Confirmaciones y victorias.
  - Rojo (`.btn-danger`): Derrotas y cancelaciones.
  - Naranja (`.btn-warning`): Rerolls y acciones secundarias.

### **2. Animaciones Clave (@keyframes)**
- **`pulse`**: Utilizada en la fase de Liga para llamar la atención del jugador sobre el objetivo actual. Alterna la opacidad suavemente.
- **`glow`**: Crea un destello radial expansivo durante la evolución, dando una sensación de poder y transformación.
- **`spin`**: Un spinner clásico para las transiciones de carga de datos desde la API.
- **`pixelated`**: Aplicado a las imágenes de los Pokémon (`image-rendering: pixelated`) para mantener la estética retro de los sprites originales.

### **3. Dinamismo en Combate**
El archivo `tablero.css` gestiona estados complejos de la interfaz:
- **Filtro de Desmayo:** Cuando un Pokémon es derrotado (`.fainted`), se aplica un filtro de escala de grises y se reduce su opacidad.
- **Enfoque de Combate (`.combat-focus`):** Durante una animación de ataque, el Pokémon seleccionado se desplaza hacia el centro de la pantalla y aumenta su tamaño, mientras que el resto del tablero se oscurece y se desenfoca (`blur`).
- **Selección de Rival:** En la Liga, el rival seleccionado resalta con un borde dorado y un icono de objetivo (`🎯`) generado mediante pseudo-elementos (`::after`).

### **4. Fondos Inmersivos**
Se utilizan imágenes de gran formato (`.webp`) con `background-attachment: fixed` para crear un efecto de profundidad sutil al hacer scroll, manteniendo la ambientación de "Paisaje Pokémon" y "Fondo de Combate" en todo momento.

---

## 📺 Lógica de Componentes (UI)

### Tablero (`tablero.ts`)
Gestiona las animaciones de combate y evolución:
- `runEvolutionAnimation()`: Utiliza un bucle con `setTimeout` para crear un efecto de "parpadeo" blanco antes de transformar los sprites del equipo.
- `seleccionarParaBatalla(index)`: Controla el flujo visual del combate (animación de ataque, revelación de estadísticas del rival tras un retraso, y ejecución de la lógica del servicio).

### Carta-Pokemon (`carta-pokemon.ts`)
Componente puramente visual con una animación de "contador" para las estadísticas:
- `animateStats()`: Cuando se revela la estadística (`revealed()`), un `setInterval` incrementa visualmente los números desde 0 hasta su valor real, proporcionando dinamismo.

---

## 🔄 Flujo de Datos (Data Flow)

1. **Entrada de Datos:** `PokemonService` -> `PokeAPI`.
2. **Procesamiento:** `GameService` recibe los datos y actualiza sus `Signals`.
3. **Persistencia:** `GameService` lanza un `effect()` que llama a `StorageService.saveGameState()`.
4. **Visualización:** `Tablero` y `Cambio` consumen los `Signals` del `GameService` de forma reactiva.
5. **Interacción:** El usuario dispara métodos en los componentes que invocan lógica en `GameService`.
