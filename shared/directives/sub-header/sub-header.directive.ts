// shared/directives/sub-header/sub-header.directive.ts
import { Directive } from '@angular/core';

@Directive({
  selector: '[sub-header]', // O el selector que desees para esta directiva
  standalone: true,
})
export class SubHeaderDirective {
  constructor() {}
}