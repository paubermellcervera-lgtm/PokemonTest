import { Routes } from '@angular/router';
import { Menu } from './Components/Pages/menu/menu';
import { Tablero } from './Components/Pages/tablero/tablero';
import { Cambio } from './Components/Pages/cambio/cambio';

export const routes: Routes = [
  { path: 'menu', component: Menu },
  { path: 'tablero', component: Tablero },
  { path: 'cambio', component: Cambio },
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
];
