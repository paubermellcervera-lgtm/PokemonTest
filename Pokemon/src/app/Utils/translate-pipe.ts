import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../Service/Translation/translation-service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Mantener esto para que se re-evalúe cuando la señal cambie
})
export class TranslatePipe implements PipeTransform {
  private translateService = inject(TranslationService);

  transform(key: string): string {
    // Al acceder a la señal 'lang' dentro de la transformación, 
    // Angular vinculará automáticamente el pipe a los cambios de esa señal.
    this.translateService.lang(); 
    return this.translateService.translate(key);
  }
}
