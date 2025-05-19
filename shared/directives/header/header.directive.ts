// shared/directives/header/header.directive.ts
import { Directive } from '@angular/core';

@Directive({
  selector: '[header]', // Este es el selector que buscará ng-content
  standalone: true,   // Importante para directivas modernas
})
export class HeaderDirective {
  constructor() {}
}